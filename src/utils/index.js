import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
// import * as pdfMake from 'pdfmake/build/pdfmake.js'
// import * as pdfFonts from 'pdfmake/build/vfs_fonts.js'
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { z } from "zod";
import { createExtractionChainFromZod } from "langchain/chains";
import { Amplify, Storage } from "aws-amplify";
import awsmobile from "../aws-exports.js";
Amplify.configure(awsmobile);

// pdfMake.vfs = pdfFonts.pdfMake.vfs;

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-0613",
  temperature: 0.5,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const lessonPromptTemplateText = `
{additionalPrompt}
Generate a lesson plan given the following context:

Subject: {subject}
Topic: {topic}
Grade: {grade}
Teacher name: {teacher}
Detail: {detailLevel}
Duration: {duration}
Region: {region}
Curriculum: {curriculum}

Include, in key/value pairs:
- Lesson Title
- Teacher name
- Subject
- Grade
- Date
- Duration
- Key vocabulary (as a bulleted list, DON'T make it a comma-separated list don't include this text in brackets in the output)
- Supporting materials and resources (as a bulleted list, DON'T include a colon (:) in this, don't include this text in brackets in the output) 
- Learning outcomes through Knowledge (key should be as is, as given here, don't include this text in brackets in output)
- Learning outcomes through skills (key should be as is, as given here, don't include this text in brackets in output)
- Learning outcomes through understandings (key should be as is, as given here, don't include this text in brackets in output)
- Modifications for students who need extra support
- Modifications for extra challenge
- Preparation of learning by students
- Planning of learning by students
- Investigation for students to carry out to learn (separate from session-by-session description, include where students can record findings, don't include this text in brackets in the output)
- Application of learning by students
- Connection of learning to personal, local and global situations by students (do not put a comma after local, don't include this text in brackets in output)
- Evaluation and reflection on learning by students
- Assessment of learning by students

Example of comma-separated list: egg, bacon, socks
Avoid this when generating supporting materials and key vocabulary.

Example of a sentence including colon: 
    Video: John Doe
Avoid this when generating any bulleted lists in this file.
Bulleted lists refer to, for example:
- Hello
- Hi
- How are you

Also, include "Guiding Questions for Educators to Reflect on and Improve their Lesson" (state it exactly as written).

Finally, also include a session-by-session description of what activities to conduct / what to teach (SEPARATE from investigation).
For example:
Session 1:
- Begin the lesson by revisiting the three equations of motion: v = u + at, s = ut + 1/2at^2, v^2 = u^2 + 2as.
- Recap the meaning and units of each variable in the equations.
- Discuss real-world applications of the equations of motion in mechanical engineering, such as motion of vehicles, machinery, and projectiles.
- Provide examples of mechanical engineering problems that can be solved using the equations of motion.
- Engage students in a class discussion to reinforce their understanding of the equations and their relevance to mechanical engineering.

Don't write numbered lists for any part of the response. Always write bulleted lists.
For any key/value pairs, include a colon (:). For any bulleted list items (supporting materials and resources, lesson title), DO NOT use colons (:). 

Ensure the plan is age-appropriate (by the grade given) and culturally relevant and acceptable in the region.
Use examples based on the region throughout the lesson plan. Make sure that the plan is tailored for the region given.
Keep in mind the curriculum and its objectives when generating.
Ensure that the learning experiences are safe for learners.
`;

const lessonPromptTemplate = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    "You are a helpful assistant that generates lesson plans based on any given context and modifies lesson plans based on user input"
  ),
  HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText),
]);

// const chain = new LLMChain({llm: model, prompt: lessonPromptTemplate});
const chain = createExtractionChainFromZod(
  z.object({
    teacher_name: z.string(),
    subject: z.string(),
    chapter_title: z.string(),
    grade: z.number(),
    section: z.string(),
    date: z.date(),
    lesson_number: z.number(),
    duration_in_minutes: z.number(),
    learning_intention: z.string(),
    learning_objective: z.string(),
    success_criteria: z.string(),
    reference_to_prior_learning: z.string(),
    lesson_introduction: z.string(),
    activity_one: z.string(),
    assessment_one: z.string(),
    activity_two: z.string(),
    assessment_two: z.string(),
    national_priorities_focus: z.string(),
    MEP_integration: z.string(),
    special_education_and_needs: z.string(),
    critical_thinking_question: z.string(),
    cross_curricular_link: z.string(),
    resources: z.string(),
    home_learning: z.string(),
  }),
  model
);

export const generateLessonPlan = async (
  teacher_name,
  subject,
  chapter_title,
  grade,
  section,
  lesson_number,
  learning_objectives,
  duration,
  curriculum
) => {
  // console.log('generateLessonPlan running')
  // const response = await chain.call({subject, topic, grade, detailLevel, duration, additionalPrompt, region, curriculum, teacher})
  // // console.log('response generated')
  // return response.text;
  const response = await chain.run(`
    Generate a lesson plan, given that:
    Teacher name: ${teacher_name} done
    Subject: ${subject} done
    Chapter title: ${chapter_title} done
    Grade: ${grade} done
    Section: ${section}  done
    Number of lessons: ${lesson_number} done
    Duration of a lesson: ${duration} done
    Learning objectives in the syllabus: 
    ${learning_objectives}
    
    
    
    Generate separate objects for each lesson and in the separate objects generate separately for each class the:
    - Learning intention 
    - Learning objective
    - Success criteria (multiple points, make this an array)
    - Reference to prior learning 
    - Method of introduction
    - First activity
    - First assessment
    - Second activity
    - Second assessment
    - Method to focus on national priorities of the United Arab Emirates
    - Integration into Moral Education Programme
    - Methods to assist students with special education needs
    - Critical thinking question of the class
    - Cross curricular links in the class
    - Resources to use in the class
    - Home learning for the class content
    
    Closely tailor the plans you generate to the requirements of the ${curriculum} curriculum.
    `);

  console.log(response);
  return response;
};

export const generateDOCX = async (lessonPlan) => {
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
    national_priorities_focus,
    MEP_integration,
    special_education_and_needs,
    critical_thinking_question,
    cross_curricular_link,
    resources,
    home_learning,
  } = lessonPlan;

  // const documentContent = fs.readFileSync(
  //   path.resolve(path.dirname(process.argv[1]), "lesson_plan_template.docx"),
  //   "binary"
  // );

  const documentRaw = await Storage.get("lesson_plan_template.docx");
  const documentContent = documentRaw.Body;

  const zip = new PizZip(documentContent);

  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

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
    reference_to_prior_learning,
    lesson_introduction,
    activity_one,
    assessment_one,
    activity_two,
    assessment_two,
    national_priorities_focus,
    MEP_integration,
    special_education_and_needs,
    critical_thinking_question,
    cross_curricular_link,
    resources,
    home_learning,
  });

  const buffer = document.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  try {
    document.render();
  } catch (e) {
    console.error(`Error: ${e}`);
  }

  const output = document.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(output, `${teacher_name} - ${subject}, ${chapter_title}`);
};
