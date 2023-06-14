import {ChatOpenAI} from 'langchain/chat_models/openai'
import {LLMChain} from 'langchain';
import {SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate} from "langchain/prompts";
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const model = new ChatOpenAI({temperature: 0.5, openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY});

const lessonPromptTemplateText = `
{additionalPrompt}
Generate a lesson plan given the following context:

Subject: {subject}
Topic: {topic}
Grade: {grade}
Detail: {detailLevel}
Duration: {duration}

Include, in key/value pairs:
- Lesson Title
- Subject
- Grade
- Date
- Duration
- Key vocabulary (as a bulleted list, don't include this text in brackets in the output)
- Supporting materials and resources (as a bulleted list, don't include this text in brackets in the output) 
- Learning outcomes through Knowledge
- Learning outcomes through skills
- Learning outcomes through understandings
- Modifications for students who need extra support
- Modifications for extra challenge
- Preparation of learning by students
- Planning of learning by students
- Investigation for students to carry out to learn (separate from session-by-session description, don't include this text in brackets in the output)
- Application of learning by students
- Connection of learning to personal, local and global situations by students
- Evaluation and reflection on learning by students
- Assessment of learning by students


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


`

const lessonPromptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate('You are a helpful assistant that generates lesson plans based on any given context and modifies lesson plans based on user input'),
    HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText)
])


const chain = new LLMChain({llm: model, prompt: lessonPromptTemplate});


export const generateLessonPlan = async (subject, topic, grade, detailLevel, duration, additionalPrompt='') => {
    console.log('generateLessonPlan running')
    const response = await chain.call({subject, topic, grade, detailLevel, duration, additionalPrompt})
    console.log('response generated')
    return response.text;
}

export const parseRawLessonPlan = (rawLessonPlan)=> {

    const parsedLessonPlan  = {}
    const planComponents = rawLessonPlan.split('\n')    ;
    let currentKey = null;

    for (let i = 0; i < planComponents.length; i++) {
        const planComponent = planComponents[i]
        if(planComponent === '')
            continue
        else {
            const isKeyValueComponent = planComponent.includes(':');
            const isListComponent = planComponent.startsWith('- ');

            if(isKeyValueComponent) {
                let [key, value] = planComponent.split(':')
                key = key.trim().toLowerCase();
                key = key.replace('- ', '')
                value = value.trim()
                parsedLessonPlan[key] = value;
                currentKey = key;
            }
            else if(isListComponent && currentKey) {
                const value = planComponent.replace('- ', '').trim();

                if (!parsedLessonPlan[currentKey])
                    parsedLessonPlan[currentKey] = []

                if (typeof parsedLessonPlan[currentKey] != 'string') {
                    // @ts-ignore
                    parsedLessonPlan[currentKey].push(value)
                } else {
                    console.error('Error: parsedLessonPlan[currentKey] is single string, not array of strings. Current key is ' + currentKey);

                }
            }
        }
    }

    return parsedLessonPlan;
}

// (async () => {
//     const rawLessonPlan = await generateLessonPlan('math', 'calculus', '11', 'high', '20 hours');
//     console.log(rawLessonPlan)
//     // console.log(parseRawLessonPlan(rawLessonPlan));
// })()

const createTable = (body) => {
    return {
        headerRows: 0,
        widths: ['*', 'auto'],
        body
    }
}

const generateList = (array)  => {
    let output = ''
    console.log('generating a list for ' + array);
    for (let element of array) {
        output += '● ' + element + '\n'
    }
    return output
}

const generateTableHeader = (text) => {
    return { text, style: 'sub-sub-header'}

}

export const generatePDF = (parsedLessonPlan) => {

    const sessionBySessionData = []
    for (const key of Object.keys(parsedLessonPlan)) {
        console.log('key: ' + key)
        if (key.startsWith('session ')) {
            sessionBySessionData.push([key[0].toUpperCase() + key.slice(1), parsedLessonPlan[key]])
        }
    }
    console.log('session by session data: ' + sessionBySessionData);

    const docDefinition = {
        content: [
            {text: parsedLessonPlan['lesson title'], style: 'header'},
            {text: parsedLessonPlan['subject'], style: 'sub-header'},
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Grade: ', parsedLessonPlan['grade']],
                    ['Duration: ', parsedLessonPlan['duration']],
                    ['Key Vocabulary: ', generateList(parsedLessonPlan['key vocabulary'])],
                    ['Materials: ', generateList(parsedLessonPlan['supporting materials and resources'])]
                ])
            },
            generateTableHeader('Learning Outcomes'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Knowledge: ', generateList(parsedLessonPlan['learning outcomes through knowledge'])],
                    ['Skills: ', generateList(parsedLessonPlan['learning outcomes through skills'])],
                    ['Understandings: ', generateList(parsedLessonPlan['learning outcomes through understandings'])]
                ])
            },
            generateTableHeader('Modifications'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Extra support', generateList(parsedLessonPlan['modifications for students who need extra support'])],
                    ['Extra challenge', generateList(parsedLessonPlan['modifications for extra challenge'])]
                ])
            },
            generateTableHeader('Learning procedure'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Preparation', generateList(parsedLessonPlan['preparation of learning by students'])],
                    ['Planning', generateList(parsedLessonPlan['planning of learning by students'])],
                    ['Investigation', generateList(parsedLessonPlan['investigation for students to carry out to learn'])],
                    ['Application', generateList(parsedLessonPlan['application of learning by students'])],
                    ['Connection', generateList(parsedLessonPlan['connection of learning to personal, local and global situations by students'])],
                    ['Evaluation', generateList(parsedLessonPlan['evaluation and reflection on learning by students'])],
                    ['Assessment', generateList(parsedLessonPlan['assessment of learning by students'])]
                ])
            },
            generateTableHeader('Reflection'),
            {text: 'Guiding questions for teachers to reflect'},
            {text: generateList(parsedLessonPlan['guiding questions for educators to reflect on and improve their lesson'])},
            generateTableHeader('Session-by-Session Breakdown'),
            {
                layout: 'lightHorizontalLines',
                table: createTable(sessionBySessionData)
            }
        ],
        defaultStyle: {
            fontSize: 15,
        },
        styles: {
            header: {
                fontSize: 22,
                bold: true
            },
            'sub-header': {
                fontSize: 20,
                bold: true
            },
            'sub-sub-header': {
                fontSize: 18,
                bold: true
            }
        }
    }

    pdfMake.createPdf(docDefinition).download('sample.pdf');
}

// generatePDF(parseRawLessonPlan(sampleLessonPlan));

export const updateLessonPlan = async (subject, topic, grade, detailLevel, duration, additionalPrompt) => {
    return await generateLessonPlan(subject, topic, grade, detailLevel, duration, (additionalPrompt + '\nKeep this in mind while doing the following task.'))
}