import { OpenAI } from 'langchain/llms/openai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
// import { AlephAlpha } from 'langchain/llms/aleph_alpha';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
// import * as pdfMake from 'pdfmake/build/pdfmake.js'
// import * as pdfFonts from 'pdfmake/build/vfs_fonts.js'
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { z } from 'zod';
import { LLMChain } from 'langchain/chains';
import { getStorage, ref, getBlob, getBytes } from 'firebase/storage';
import { app } from './firebase.js';
// import Tesseract, { createWorker } from 'tesseract.js';
// import Jimp from 'jimp';
import { createExtractionChainFromZod } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';

export const getData = async () => {
  const drive = google.drive({ version: 'v3', auth });
  try {
    const res = await drive.files.list();
    const files = res.data.files;

    return files;
  } catch (error) {
    console.error('Error fetching files: ', error);
    return null;
  }
};

// pdfMake.vfs = pdfFonts.pdfMake.vfs;
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo-16k-0613',
  temperature: 0.4,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const noChatModel = new OpenAI({
  modelName: 'gpt-3.5-turbo-16k-0613',
  temperature: 0.4,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const preprocessImage = async (imageBlob) => {
  try {
    const image = await Jimp.read(URL.createObjectURL(imageBlob));
    image.grayscale();
    image.threshold({ max: 128 });
    image.median(3);
    const returned = image.autocrop(0.1, false);
    // console.log('returned: ', returned);

    return imageBlob;
  } catch (error) {
    console.error(error.message);
  }
};

export const generateTextFromImage = async (image) => {
  // image = await preprocessImage(image);
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const {
    data: { text },
  } = await worker.recognize(image);
  // console.log(text);
  await worker.terminate();
  return text;
};

// INPUT COSTS $0.003

const websiteGenerationPromptTemplateText = `
Generate a nested array of queries based on the lesson plan given below. The queries are intended for teachers to search google for resources that may support them in doing these activities in class. Consequently, if no resources are necessary for an activity don't generate a query.
While doing this, follow the following procedure:
1. Identify the most important resource that could help the teacher with doing the activity.
2. Generate a query to search for that resource.

Follow all of the following guidelines:
1. The number of arrays in the nested array should be {number}
2. The length of each array should be 7. Each array should contain 1 query or an empty string for each of the following sections of a lesson plan.
  1. Method of linking back to and reviewing learning in prior lessons
  2. Method of introducing the lesson
  3. First activity
  4. First assessment
  5. Second activity
  6. Second assessment
  7. Home learning
3. Do not repeat the activity you are generating a query for in the query. For example:
  - If the activity is "Method of introducing the lesson: Teacher will present the poem "The Princess and the Gypsies" to the class, providing background information and context.", do not generate a query like "introducing the lesson" instead generate a query that actually helps the teacher introduce the lesson like a query to find the poem: "the princess and the gypsies full poem online".
4. You do not need to generate queries for every activity given above. Generate queries only if you think any resources from the internet are necessary to do that activity. If no resources are required then just generate an empty string.
5. Do not generate more than 1 query for each of the above sections of the lesson plan.
6. Generate the search queries for each section in the order given by the numbered list above.
7. Do not generate queries for any section of the lesson plan which requires independent research by students. Instead, generate an empty string. For example, here are examples of activities that would require independent research by students:
  - Students will complete a project individually, where they will design a circular garden and calculate the area and circumference of the garden
  - Any individual projects
  - Any individual research
8. Do not generate queries for any section of the lesson plan which depends on a textbook. Activities which depend on a textbook include:
  - Solving exercises from a textbook
  - Reading a passage from the textbook
9. Instead of generating queries about activities, teaching strategies or ideas for lessons related to the topic, generate queries about the topic itself. For example:
  - if the topic is related to genres, instead of generating "ideas to teach students about genres", "strategies for introducing students to genres", etc. generate something like "importance of genres in literature".
  - similarly, if the topic is "Mechanics", instead of generating "activities for a mechanics class", "ideas for teaching students mechanics" generate "mechanics simulations" or "importance of mechanics" or "real life applications of mechanics".
10. Don't generate any queries that include the phrases "ideas" or "activities". For example: 
  - don't generate any query like "activities to review the international system of units in physics".
11. Add the curriculum, subject and grade to the end of any query you generate.
  - For example, if the curriculum is "ICSE", the grade is 9, the subject is chemistry and the activity is "review the properties of water and its ability to dissolve solutes" then the query would be "properties of water and its ability to dissolve solutes ICSE class 9 chemistry"
  - Similarly, if the curriculum is "ICSE", the grade is 9, the subject is english literature and the activity is "discuss the importance of genres in literature" the query would be "importance of genres ICSE class 9 english literature" 

Lesson plan/s:
-----------------------
{lesson_plan}
-----------------------

Follow these formatting instructions:
{format_instructions}
`;

const parsingChain = createExtractionChainFromZod(
  z.object({
    teacher_name: z.string().min(1),
    subject: z.string().min(1),
    chapter_title: z.string().min(1),
    grade: z.number(),
    section: z.string().min(1),
    date: z.date(),
    lesson_number: z.number(),
    duration_in_minutes: z.number(),
    learning_intention: z.string().min(1),
    learning_objective: z.string().min(1),
    success_criteria: z.string().min(1),
    reference_to_prior_learning: z.string().min(1),
    lesson_introduction: z.string().min(1),
    activity_one: z.string().min(1),
    assessment_one: z.string().min(1),
    activity_two: z.string().min(1),
    assessment_two: z.string().min(1),
    moral_education_programme_integration: z.string().min(1),
    special_education_and_needs: z.string().min(1),
    critical_thinking_question: z.string().min(1),
    cross_curricular_link: z.string().min(1),
    resources: z.string().min(1),
    home_learning: z.string().min(1),
    high_order_questions: z.string().min(1),
    medium_order_questions: z.string().min(1),
    low_order_questions: z.string().min(1),
  }),
  model
);
// const arrayParser = StructuredOutputParser.fromZodSchema(
//   z
//     .array(z.string())
//     .describe(
//       'an array of search queries to send to google for generating a series of lesson plans for a particular chapter'
//     )
// );

const arrayParser = StructuredOutputParser.fromZodSchema(
  z
    .array(
      z
        .array(z.string().describe('a search query'))
        .describe('array of queries for one lesson plan')
    )
    .describe('array of queries for all lesson plans')
);

const format_instructions = arrayParser.getFormatInstructions();

const websiteGenerationPromptTemplate = new PromptTemplate({
  template: websiteGenerationPromptTemplateText,
  inputVariables: ['lesson_plan', 'format_instructions', 'number'],
});

const generateURLsFromQueries = async (queries) => {
  let URLs = [];
  for (let query of queries) {
    if (query === '') {
      URLs.push('');
      continue;
    }
    try {
      const response = await fetch(`/api/serp?query=${query}`, {
        method: 'GET',
      });
      const data = await response.json();
      // console.log(data);
      // URLs.push(data.organic_results[0].link);
      URLs.push(data.result.organic_results[0].url);
    } catch (error) {
      console.error('Error: ' + error);
    }
  }
  return URLs;
};

// OUTPUT COSTS $0.004
// PARSING COSTS $0.003+$0.003072=$0.006072
export const generateLessonPlan = async (
  teacher_name,
  subject,
  chapter_title,
  grade,
  section,
  lesson_number,
  learning_objectives,
  learning_intention,
  moral_education_objectives,
  duration,
  curriculum,
  includesTeacherStudentSplit,
  previous_covered_content
) => {
  const lessonPromptTemplateText = `
Generate a lesson description, given that:
Teacher name: {teacher_name}
Subject: {subject}
Chapter title: {chapter_title}
Grade: {grade}
Section: {section}
Curriculum: {curriculum}
Number of lessons: {lesson_number}
Duration of a lesson: {duration} minutes
Learning intention in the syllabus: {learning_intention}
Learning objectives in the syllabus: 
{learning_objectives}
Moral Education Objectives:
{moral_education_objectives}
Content covered previously: 
{previous_covered_content}
Follow the following guidelines when generating the lesson plan:
1. For each lesson, include, in key/value pairs, values for the:
  - Teacher name
  - Subject
  - Chapter title
  - Grade
  - Section
  - Duration
  - Learning intention of the entire ongoing chapter / unit. This should be same for all the lessons.
  - Learning objective of the lesson
  - Success criteria (multiple points, make this an array)
  - Method of linking back to and reviewing learning in prior lessons ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - Method of introducing the lesson  ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - First activity (lower order activity)  ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - First assessment (lower order assessment)  ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - Second activity (higher order activity)  ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - Second assessment (higher order assessment)  ${
    includesTeacherStudentSplit ? ' with teacher-student split percentage' : ''
  }
  - Integration into Moral Education Programme
  - Methods to assist students with special education needs and students with disabilities (blindness, deafness, autism and other neurodevelopmental disorders)
  - Critical thinking question of the class
  - Cross curricular links in the class
  - Resources to use in the class
  - Home learning for the class content and how the home learning will be assessed by the teachers
  - Higher order sample questions for tests / exams
  - Medium order sample questions for tests / exams
  - Lower order sample questions for tests / exams
2. Tailor at least one of the activities or plenaries or assessments to the moral education objectives provided. Also, include a description of how you are tailoring the activities to the moral education programme objectives next to "Integration into Moral Education Programme". In this description, mention which specific activities are tailored to the moral education programme objectives.
3. Generate {lesson_number} lesson plans. DO NOT generate less than {lesson_number} lesson plans.
4. Generate the lesson plan in future tense declarative. DO NOT BE IMPERATIVE IN HOW YOU GENERATE. For example:
  - Instead of generating: "Show students a large number written on the board and ask them to identify the place value and face value of a specific digit."
  - Generate: "Teachers will show students a large number written on the board and ask them to identify the place value and face value of a specific digit."
5. Include the assessment of home learning of a prior lesson in the lesson plans of subsequent lessons.
6. Closely tailor the plans you generate to the requirements of the {curriculum} curriculum. Make sure that lesson plans for the same topic aren't the same for two different curricula.
7. Don't be repetitive in the lesson plans you generate. Two consecutive lesson plans should not have the same activities.
8. Make each lesson plan unique to the topic. Don't be generic with what you generate. Two lesson plans of different topics should not have the same activities.
9. Generate the "Method to link back to prior learning" for the first lesson plan based on the content covered previously given above ({previous_covered_content}). For the lesson plans after the first lesson plan, generate the method to link back to prior learning based on the prior lesson plans.
${
  includesTeacherStudentSplit
    ? `10. Generate the teacher-student involvement split percentage in brackets for placement at the end of the description of the method to link back to prior lessons, method to introduce the lesson, first activity, first assessment, second activity and second assessment. The teacher-student involvement split percentage is a percentage that tells how much percent of the activity a teacher must be involved in and how much percent of the activity a student must be involved in.
    - For example, an activity with brackets might like: "Experiment to determine relationship between resistivity and length (70% student-led, 30% teacher-led)".
`
    : ''
}
 

Extra context on the terms that may be used:
1. Higher order refers to the "create", "evaluate" and "analyse" levels in Blooms' taxonomy. It also refers to the "extended abstract" and "relational" parts of the SOLO taxonomy. This means that knowledge is heavily interconnected and students have an integrated understanding of a topic. Lots of questions and topics about evaluating relations of concepts would be here.  
2. Medium order refers to the "apply" and "understand" levels in Blooms' taxonomy. It also refers to the "multistructural" part of the SOLO taxonomy. This means that knowledge is somewhat interconnected and students have a somewhat integrated understanding. Largely just questions and topics about how some knowledge can be used in new ways.
3. Low order refers to the "remember" level in Blooms' taxonomy. It refers to the "unistructural" part of SOLO taxonomy. This means knowledge is completely isolated and students know knowledge only in isolation. This is largely memorisation-based stuff.
4. ICSE is an Indian syllabus where greater emphasis is placed on learning from a textbook, a strict syllabus and end-of-year exams.
5. MYP is an international syllabus where greater emphasis is placed on research-centric learning, project-based learning/assessment and international mindedness.
`;

  // console.log(lessonPromptTemplateText);
  const lessonPromptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      'You are a helpful assistant that generates lesson plans based on any given context. You always generate as many lesson plans as you are asked to (never less lesson plans than you are asked to). You generate the lesson plans in declarative future tense, not in an imperative way. For example, instead of saying "Show students a large number written on the board and ask them to identify the place value and face value of a specific digit." say "Teachers will show students a large number written on the board and ask them to identify the place value and face value of a specific digit."'
    ),
    HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText),
  ]);

  const chain = new LLMChain({ llm: model, prompt: lessonPromptTemplate });
  const rawResponse = await chain.call({
    teacher_name,
    subject,
    chapter_title,
    grade,
    section,
    lesson_number,
    learning_objectives,
    learning_intention,
    moral_education_objectives,
    duration,
    curriculum,
    previous_covered_content,
  });
  console.log('generated raw response');
  console.log(rawResponse.text);
  let JSONResponse = await parsingChain.run(rawResponse.text);
  if (!Array.isArray(JSONResponse)) {
    JSONResponse = [JSONResponse];
  }
  console.log('generated json response');
  console.log(JSONResponse);
  return [JSONResponse, rawResponse.text];
};

export const generateURLsFromLessonPlan = async (lessonPlansRaw, number) => {
  let nestedURLs = [];

  const input = await websiteGenerationPromptTemplate.format({
    lesson_plan: lessonPlansRaw,
    format_instructions,
    number,
  });
  // console.log('Input: \n' + input);
  const queries = await noChatModel.call(input);
  console.log('queries generated');
  // console.log(queries);
  let queries_parsed = await arrayParser.parse(queries);
  console.log('queries parsed');
  console.log(queries_parsed);
  for (let one_lesson_queries of queries_parsed) {
    const urls = await generateURLsFromQueries(one_lesson_queries);
    console.log('urls generated for a lesson');
    nestedURLs.push(urls);
  }
  console.log('urls generated for all lessons');
  console.log(nestedURLs);
  return nestedURLs;
};

// TOTAL COST IS $0.003+$0.006072=$0.009072=AED 0.03

export const generateDOCX = async (
  lessonPlans,
  urlsNested,
  templateInBytes
) => {
  console.log('generateDOCX running');
  // console.log(lessonPlans);
  // console.log(lessonPlans.length);
  let lessonPlanDocuments = [];

  for (let i = 1; i <= lessonPlans.length; i++) {
    console.log('inner loop running');

    const {
      teacher_name,
      subject,
      chapter_title,
      grade,
      section,
      lesson_number,
      duration_in_minutes,
      learning_intention,
      learning_objective,
      success_criteria,
      reference_to_prior_learning,
      lesson_introduction,
      activity_one,
      assessment_one,
      activity_two,
      assessment_two,
      special_education_and_needs,
      critical_thinking_question,
      cross_curricular_link,
      resources,
      home_learning,
      high_order_questions,
      medium_order_questions,
      low_order_questions,
      moral_education_programme_integration: MEP_integration,
    } = lessonPlans[i - 1];
    console.log('extracted relevant information, generating document bytes');
    const urls = urlsNested[i - 1];
    const storage = getStorage();
    console.log('logged in for storage');
    const pathReference = ref(storage, '/lesson_plan_template.docx');
    const templateInBytes = await getBytes(pathReference);
    console.log('generated template bytes');
    const zip = new PizZip(templateInBytes);
    console.log('generated pizzip file');
    const document = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    console.log('generated document file using docxtemplater');

    document.setData({
      teacher_name,
      subject,
      chapter_title,
      grade,
      section,
      lesson_number,
      duration_in_minutes,
      learning_intention,
      learning_objective,
      success_criteria,
      reference_to_prior_learning:
        reference_to_prior_learning +
        `${urls[0] !== '' ? ` (${urls[0]})` : ''}`,
      lesson_introduction:
        lesson_introduction + `${urls[1] !== '' ? ` (${urls[1]})` : ''}`,
      activity_one: activity_one + `${urls[2] !== '' ? ` (${urls[2]})` : ''}`,
      assessment_one:
        assessment_one + `${urls[3] !== '' ? `(${urls[3]})` : ''}`,
      activity_two: activity_two + `${urls[4] !== '' ? ` (${urls[4]})` : ''}`,
      assessment_two:
        assessment_two + `${urls[5] !== '' ? ` (${urls[5]})` : ''}`,
      MEP_integration,
      special_education_and_needs,
      critical_thinking_question,
      cross_curricular_link,
      resources,
      home_learning: home_learning + `${urls[6] !== '' ? ` (${urls[6]})` : ''}`,
      high_order_questions,
      medium_order_questions,
      low_order_questions,
    });

    console.log('document data set, now trying to render document');

    try {
      document.render();
      console.log('document rendered');

      const generatedLessonPlanDocx = document.getZip().generate({
        type: 'blob',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      console.log('docx generated');

      lessonPlanDocuments.push(generatedLessonPlanDocx);

      saveAs(
        generatedLessonPlanDocx,
        `${teacher_name} - ${subject}, ${chapter_title} - Lesson ${i}.docx`
      );
    } catch (e) {
      console.error(`Error: ${e}`);
    }
  }

  return lessonPlanDocuments;
};
