// NOTE: this file actually runs on the client-side, not on the server-side

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
import { app, db } from './firebase.js';
// import Tesseract, { createWorker } from 'tesseract.js';
// import Jimp from 'jimp';
import { createExtractionChainFromZod } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JsonOutputFunctionsParser } from 'langchain/output_parsers';

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

const noChatModel = new OpenAI({
  modelName: 'gpt-3.5-turbo-1106',
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

// TODO: Make sure that this generates queries for the important info like activities instead of generating it for admin info
const websiteGenerationPromptTemplateText = `
Generate an array that contains JavaScript objects which have queries based on the lesson plans given below. The queries are intended for teachers to search google for resources that may support them in doing these activities in class. Consequently, if no resources are necessary for an activity don't generate a query.
While doing this, follow the following procedure:
1. Identify the most important resource that could help the teacher with doing the activity.
2. Generate a query to search for that resource.

Follow all of the following guidelines:
1. There should be {number} arrays in the nested array.
2. The length of each JSON object in the nested array should be at most {innerNumber} and at least 0. The key should be the key taken from the original lesson plan. The value should be 1 query or an empty string.
3. Do not repeat the activity you are generating a query for in the query.
4. You do not need to generate queries for every component given in the lesson plan. Generate queries only if you think any resources from the internet are necessary to do that component. If no resources are required then just generate an empty string. For example, resources may not be necessary when the activity/component involves a prescribed textbook. Queries must also not be generated when a component of the lesson plan is something like a 'grade', 'section', 'chapter title', 'teacher name', 'subject', etc that doesn't actually include any lesson content.
5. Do not generate more than 1 query for each of the above sections of the lesson plan.
6. Do not generate queries for any section of the lesson plan which requires independent research by students. Instead, generate an empty string. For example, here are examples of activities that would require independent research by students:
  - Students will complete a project individually, where they will design a circular garden and calculate the area and circumference of the garden
  - Any individual projects
  - Any individual research
7. Do not generate queries for any section of the lesson plan which depends on a textbook. Activities which depend on a textbook include:
  - Solving exercises from a textbook
  - Reading a passage from the textbook
8. Instead of generating queries about activities, teaching strategies or ideas for lessons related to the topic, generate queries about the topic itself. For example:
  - if the topic is related to genres, instead of generating "ideas to teach students about genres", "strategies for introducing students to genres", etc. generate something like "importance of genres in literature".
  - similarly, if the topic is "Mechanics", instead of generating "activities for a mechanics class", "ideas for teaching students mechanics" generate "mechanics simulations" or "importance of mechanics" or "real life applications of mechanics".
9. Don't generate any queries that include the phrases "ideas" or "activities". For example: 
  - don't generate any query like "activities to review the international system of units in physics".
10. Add the curriculum, subject and grade mentioned in the following lesson plans to the end of any query you generate.

Lesson plan/s:
-----------------------
{lesson_plan}
-----------------------

Follow these formatting instructions:
{format_instructions}
`;

// const lessonPlanParser = StructuredOutputParser.fromZodSchema(
//   z.array(
//     z.object({
//       teacher_name: z.string().min(1),
//       subject: z.string().min(1),
//       chapter_title: z.string().min(1),
//       grade: z.number(),
//       section: z.string().min(1),
//       lesson_number: z.number(),
//       duration_in_minutes: z.number(),
//       learning_intention: z.string().min(1),
//       learning_objective: z.string().min(1),
//       success_criteria: z.string().min(1),
//       reference_to_prior_learning: z.string().min(1),
//       lesson_introduction: z.string().min(1),
//       activity_one: z.string().min(1),
//       assessment_one: z.string().min(1),
//       activity_two: z.string().min(1),
//       assessment_two: z.string().min(1),
//       moral_education_programme_integration: z.string().min(1),
//       special_education_and_needs: z.string().min(1),
//       critical_thinking_question: z.string().min(1),
//       cross_curricular_link: z.string().min(1),
//       resources: z.string().min(1),
//       home_learning: z.string().min(1),
//       high_order_questions: z.string().min(1),
//       medium_order_questions: z.string().min(1),
//       low_order_questions: z.string().min(1),
//     })
//   ),
//   model
// );
const lessonPlanSchema = z.array(
  z.object({
    teacher_name: z.string().min(1),
    subject: z.string().min(1),
    chapter_title: z.string().min(1),
    grade: z.number(),
    section: z.string().min(1),
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
  })
);

const lessonPlanFunctionSchema = {
  name: 'output_formatter',
  description: 'Should always be used to properly format output',
  parameters: zodToJsonSchema(lessonPlanSchema),
};

const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo-1106',
  temperature: 0.4,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
}).bind({
  functions: [lessonPlanFunctionSchema],
  function_call: { name: 'output_formatter' },
});

// const lessonPlanFormatInstructions = lessonPlanParser.getFormatInstructions();
// const arrayParser = StructuredOutputParser.fromZodSchema(
//   z
//     .array(z.string())
//     .describe(
//       'an array of search queries to send to google for generating a series of lesson plans for a particular chapter'
//     )
// );

const queriesParser = StructuredOutputParser.fromZodSchema(
  z
    .array(
      z
        .record(z.string())
        .describe(
          'object with keys as sections of lesson plan and values as queries'
        )
    )
    .describe(
      'array of arrays queries for all lesson plans of length equal to number of lesson plans'
    )
);

const format_instructions = queriesParser.getFormatInstructions();

const websiteGenerationPromptTemplate = new PromptTemplate({
  template: websiteGenerationPromptTemplateText,
  inputVariables: [
    'lesson_plan',
    'format_instructions',
    'number',
    'innerNumber',
  ],
});

const generateURLsFromQueries = async (queries) => {
  let URLs = {};
  for (let key in queries) {
    const query = queries[key];
    if (query === '') {
      URLs[key] = '';
      continue;
    }
    try {
      const response = await fetch(`/api/serp?query=${query}`, {
        method: 'GET',
      });
      const data = await response.json();
      // console.log(data);
      // URLs.push(data.organic_results[0].link);
      URLs[key] = data.result.organic_results[0].url;
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
  previous_covered_content,
  schoolName
) => {
  const schoolDocs = await getDocs(
    query(collection(db, 'schools'), where('name', '==', schoolName))
  );
  let variablesWithDescriptions;
  schoolDocs.forEach((schoolDoc) => {
    variablesWithDescriptions = schoolDoc.data().variables;
  });
  let variables = '';
  for (const variable in variablesWithDescriptions) {
    variables += `${variable}: ${variablesWithDescriptions[variable]}\n`;
  }
  const lessonPromptTemplateText = `
Generate a set of {lesson_number} lesson descriptions, given that:
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
Follow the following guidelines when generating the lesson plans:
1. For each lesson plan, include, in key/value pairs in a bulleted list in the format "a: b" with a colon, values for ALL of the following (do not omit any of these in any of the lesson plans generated):
   ${variables}
2. Tailor at least one of the activities or plenaries or assessments to the moral education objectives provided. Also, include a description of how you are tailoring the activities to the moral education programme objectives next to "Integration into Moral Education Programme". In this description, mention which specific activities are tailored to the moral education programme objectives.
3. Generate {lesson_number} lesson plans. DO NOT generate less than {lesson_number} lesson plans.
4. Generate the lesson plan in future tense declarative. DO NOT BE IMPERATIVE IN HOW YOU GENERATE. For example:
  - Instead of generating: "Show students a large number written on the board and ask them to identify the place value and face value of a specific digit."
  - Generate: "Teachers will show students a large number written on the board and ask them to identify the place value and face value of a specific digit."
  - Also, please do not use the name of the teacher in any place other than next to "Teacher name" in the bulleted list above. Instead, say "The teacher".
6. Closely tailor the plans you generate to the requirements of the {curriculum} curriculum. Make sure that lesson plans for the same topic aren't the same for two different curricula.
7. Don't be repetitive in the lesson plans you generate. Two consecutive lesson plans should not have the same activities.
8. Make each lesson plan unique to the topic. Don't be generic with what you generate. Two lesson plans of different topics should not have the same activities.
${
  includesTeacherStudentSplit
    ? `11. Generate the teacher-student involvement split percentage in brackets for placement at the end of the each activity. The teacher-student involvement split percentage is a percentage that tells how much percent of the activity a teacher must be involved in and how much percent of the activity a student must be involved in.
    - For example, an activity with brackets might like: "Experiment to determine relationship between resistivity and length (70% student-led, 30% teacher-led)".
    `
    : ''
}
 

Extra context on the terms that may be used:
1. Higher order refers to the "create", "evaluate" and "analyse" levels in Blooms' taxonomy. It also refers to the "extended abstract" and "relational" parts of the SOLO taxonomy. This means that knowledge is heavily interconnected and students have an integrated understanding of a topic. Lots of questions and topics about evaluating relations of concepts would be here.  
2. Medium order refers to the "apply" and "understand" levels in Blooms' taxonomy. It also refers to the "multistructural" part of the SOLO taxonomy. This means that knowledge is somewhat interconnected and students have a somewhat integrated understanding. Largely just questions and topics about how some knowledge can be used in new ways.
3. Low order refers to the "remember" level in Blooms' taxonomy. It refers to the "unistructural" part of SOLO taxonomy. This means knowledge is completely isolated and students know knowledge only in isolation. This is largely memorisation-based stuff.
4. ICSE is an Indian syllabus where greater emphasis is placed on learning from a textbook, a strict syllabus and end-of-year exams. ISC is the senior school version of this.
5. MYP is an international syllabus where greater emphasis is placed on research-centric learning, project-based learning/assessment and international mindedness. IB is the senior school version of this.

`;

  // console.log(lessonPromptTemplateText);
  const lessonPromptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      'You are a helpful assistant that generates lesson plans based on any given context. You always generate as many lesson plans as you are asked to (never less lesson plans than you are asked to). You generate the lesson plans in declarative future tense, not in an imperative way. For example, instead of saying "Show students a large number written on the board and ask them to identify the place value and face value of a specific digit." say "Teachers will show students a large number written on the board and ask them to identify the place value and face value of a specific digit."'
    ),
    HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText),
  ]);

  const outputParser = new JsonOutputFunctionsParser();

  // const chain = new LLMChain({ llm: model, prompt: lessonPromptTemplate });
  const chain = lessonPromptTemplate.pipe(model).pipe(outputParser);
  const rawResponse = await chain.invoke({
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
  console.log(JSON.stringify(rawResponse, null, 2));
  // let JSONResponse = await parsingChain.run(rawResponse.text);
  // if (!Array.isArray(JSONResponse)) {
  //   JSONResponse = [JSONResponse];
  // }
  // console.log('generated json response');
  // console.log(JSONResponse);
  return [lessonPlansParsed, rawResponse.text];
};

export const generateURLsFromLessonPlan = async (
  lessonPlansRaw,
  numberOfLessons,
  numberOfVariables
) => {
  let nestedURLs = [];

  const input = await websiteGenerationPromptTemplate.format({
    lesson_plan: lessonPlansRaw,
    format_instructions,
    number: numberOfLessons,
    innerNumber: numberOfVariables,
  });
  // console.log('Input: \n' + input);
  const queries = await noChatModel.call(input);
  console.log('queries generated');
  console.log(queries);
  let queries_parsed = await queriesParser.parse(queries);
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
  templateInBytes,
  email,
  sendMethod
) => {
  console.log('generateDOCX running');
  console.log(email);
  console.log(lessonPlans);
  console.log(lessonPlans.length);
  console.log(sendMethod);
  let lessonPlanDocuments = [];

  for (let i = 1; i <= lessonPlans.length; i++) {
    console.log('inner loop running');

    // const {
    //   teacher_name,
    //   subject,
    //   chapter_title,
    //   grade,
    //   section,
    //   lesson_number,
    //   duration_in_minutes,
    //   learning_intention,
    //   learning_objective,
    //   success_criteria,
    //   reference_to_prior_learning,
    //   lesson_introduction,
    //   activity_one,
    //   assessment_one,
    //   activity_two,
    //   assessment_two,
    //   special_education_and_needs,
    //   critical_thinking_question,
    //   cross_curricular_link,
    //   resources,
    //   home_learning,
    //   high_order_questions,
    //   medium_order_questions,
    //   low_order_questions,
    //   moral_education_programme_integration: MEP_integration,
    // } = lessonPlans[i - 1];
    const lessonPlan = lessonPlans[i - 1];
    console.log('extracted relevant information, generating document bytes');
    const urls = urlsNested[i - 1];
    console.log('logged in for storage');
    const zip = new PizZip(templateInBytes);
    console.log('generated pizzip file');
    const document = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    console.log('generated document file using docxtemplater');
    const newObject = {};
    for (let key in lessonPlan) {
      newObject[[key]] = `${lessonPlan[[key]]} ${
        urls[[key]] === '' && urls[[key]] ? '' : `(${urls[[key]]})`
      }`;
    }
    // document.setData({
    //   teacher_name,
    //   subject,
    //   chapter_title,
    //   grade,
    //   section,
    //   lesson_number,
    //   duration_in_minutes,
    //   learning_intention,
    //   learning_objective,
    //   success_criteria,
    //   reference_to_prior_learning:
    //     reference_to_prior_learning +
    //     `${urls[0] !== '' ? ` (${urls[0]})` : ''}`,
    //   lesson_introduction:
    //     lesson_introduction + `${urls[1] !== '' ? ` (${urls[1]})` : ''}`,
    //   activity_one: activity_one + `${urls[2] !== '' ? ` (${urls[2]})` : ''}`,
    //   assessment_one:
    //     assessment_one + `${urls[3] !== '' ? `(${urls[3]})` : ''}`,
    //   activity_two: activity_two + `${urls[4] !== '' ? ` (${urls[4]})` : ''}`,
    //   assessment_two:
    //     assessment_two + `${urls[5] !== '' ? ` (${urls[5]})` : ''}`,
    //   MEP_integration,
    //   special_education_and_needs,
    //   critical_thinking_question,
    //   cross_curricular_link,
    //   resources,
    //   home_learning: home_learning + `${urls[6] !== '' ? ` (${urls[6]})` : ''}`,
    //   high_order_questions,
    //   medium_order_questions,
    //   low_order_questions,
    // });
    document.setData(newObject);

    console.log('document data set, now trying to render document');

    try {
      document.render();
      console.log('document rendered');

      const generatedLessonPlanDocx = document.getZip().generate({
        type: 'blob',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      lessonPlanDocuments.push(generatedLessonPlanDocx);
    } catch (e) {
      console.error(`Error: ${e}`);
    }
  }

  if (sendMethod === 'directDownload') {
    for (let i = 0; i < lessonPlanDocuments.length; i++) {
      saveAs(
        lessonPlanDocuments[i],
        `${lessonPlans[i].teacher_name} - ${lessonPlans[i].subject}, ${
          lessonPlans[i].chapter_title
        } - Lesson ${i + 1}.docx`
      );
    }
  }

  if (sendMethod === 'email') {
    // add lessonPlanDocuments to body of POST request and send it to email API route
    const formData = new FormData();

    for (const lessonPlanDocument of lessonPlanDocuments) {
      formData.append('lesson plans', lessonPlanDocument);
    }
    console.log(formData.getAll('lesson plans'));

    const teacherName = lessonPlans[0].teacher_name;
    const lessonSubject = lessonPlans[0].subject;
    const topic = lessonPlans[0].chapter_title;
    try {
      const response = await fetch(
        `/api/email?subject=${`Generated lesson plans for ${topic}`}&userEmail=${email}&teacherName=${teacherName}&text=${`Dear ${teacherName},
        Please find attached your lesson plans for ${topic}.

        Regards,
        LessonGPT
        `}&lessonSubject=${lessonSubject}&topic=${topic}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
    } catch (error) {
      console.error('Error: ' + error);
    }
  }

  return lessonPlanDocuments;
};
