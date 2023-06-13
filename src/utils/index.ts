import {ChatOpenAI} from 'langchain/chat_models/openai'
import {LLMChain} from 'langchain';
import {SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate} from "langchain/prompts";
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

type ParsedLessonPlan = {
    [key: string]: string | string[]
}
const model = new ChatOpenAI({temperature: 0.5, openAIApiKey: process.env.OPENAI_API_KEY});

const lessonPromptTemplateText = `
Generate a lesson plan given the following context:

Subject: {subject}
Topic: {topic}
Grade: {grade}
Detail: {detailLevel}
Duration: {duration}


Include, in key/value pairs:
- Lesson plan
- Subject
- Grade
- Date
- Duration
- Key vocabulary
- Supporting materials and resources
- Learning outcomes through Knowledge
- Learning outcomes through skills
- Learning outcomes through understandings
- Modifications for students who need extra support
- Modifications for extra challenge
- Preparation of learning by students
- Planning of learning by students
- Learning by investigation by students
- Application of learning by students
- Connection of learning to personal, local and global situations by students
- Evaluation and reflection on learning by students
- Assessment of learning by students


Also, include guiding questions for educators to reflect on and improve their lesson.
Don't write numbered list. Write bulleted lists.
`

const lessonPromptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate('You are a helpful assistant that generates lesson plans based on any given context and modifies lesson plans based on user input'),
    HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText)
])


const chain = new LLMChain({llm: model, prompt: lessonPromptTemplate});


export const generateLessonPlan = async (subject: string, topic: string, grade: string, detailLevel: string, duration: string) => {
    console.log('generateLessonPlan running')
    const response = await chain.call({subject, topic, grade, detailLevel, duration})
    console.log('response generated')
    return response.text;
}

export const parseRawLessonPlan = (rawLessonPlan: string): ParsedLessonPlan => {

    const parsedLessonPlan: ParsedLessonPlan = {}
    const planComponents = rawLessonPlan.split('\n')    ;
    let currentKey = null;

    for (let i = 0; i < planComponents.length; i++) {
        const planComponent = planComponents[i]
        if(planComponent == '')
            continue
        else {
            const isKeyValueComponent = planComponent.includes(':');
            const isListComponent = planComponent.startsWith('- ');

            if(isKeyValueComponent) {
                let [key, value] = planComponent.split(':')
                key = key.trim()
                key = key.replace('- ', '')
                value = value.trim()
                parsedLessonPlan[key] = value;
                currentKey = key;
            }
            else if(isListComponent && currentKey) {
                const value = planComponent.replace('- ', '').trim();

                if (!parsedLessonPlan[currentKey])
                    parsedLessonPlan[currentKey] = []

                // @ts-ignore
                parsedLessonPlan[currentKey].push(value)
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

const createTable = (body: ([string, (string | string[])] | [string, string])[]) => {
    return {
        headerRows: 0,
        widths: ['*', 'auto'],
        body
    }
}

const generateList = (array: string | string[]): string => {
    let output = ''
    for (let element of array) {
        output += '● ' + element + '\n'
    }
    return output
}

const generateTableHeader = (text: string) => {
    return { text, style: 'sub-sub-header'}

}

export const generatePDF = (parsedLessonPlan: ParsedLessonPlan) => {

    const docDefinition = {
        content: [
            {text: parsedLessonPlan['Lesson Plan'], style: 'header'},
            {text: parsedLessonPlan['Subject'], style: 'sub-header'},
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Grade: ', parsedLessonPlan['Grade']],
                    ['Duration: ', parsedLessonPlan['Duration']],
                    ['Key Vocabulary: ', generateList(parsedLessonPlan['Key Vocabulary'])],
                    ['Materials: ', generateList(parsedLessonPlan['Supporting Materials and Resources'])]
                ])
            },
            generateTableHeader('Learning Outcomes'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Knowledge: ', generateList(parsedLessonPlan['Learning Outcomes through Knowledge'])],
                    ['Skills: ', generateList(parsedLessonPlan['Learning Outcomes through Skills'])],
                    ['Understandings: ', generateList(parsedLessonPlan['Learning Outcomes through Understandings'])]
                ])
            },
            generateTableHeader('Modifications'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Extra support', generateList(parsedLessonPlan['Modifications for Students who Need Extra Support'])],
                    ['Extra challenge', generateList(parsedLessonPlan['Modifications for Extra Challenge'])]
                ])
            },
            generateTableHeader('Learning procedure'),
            {
                layout: 'lightHorizontalLines',
                table: createTable([
                    ['Preparation', generateList(parsedLessonPlan['Preparation of Learning by Students'])],
                    ['Planning', generateList(parsedLessonPlan['Planning of Learning by Students'])],
                    ['Investigation', generateList(parsedLessonPlan['Learning by Investigation by Students'])],
                    ['Application', generateList(parsedLessonPlan['Application of Learning by Students'])],
                    ['Connection', generateList(parsedLessonPlan['Connection of Learning to Personal, Local, and Global Situations by Students'])],
                    ['Evaluation', generateList(parsedLessonPlan['Evaluation and Reflection on Learning by Students'])],
                    ['Assessment', generateList(parsedLessonPlan['Assessment of Learning by Students'])]
                ])
            },
            generateTableHeader('Reflection'),
            {text: 'Guiding questions for teachers to reflect'},
            {text: generateList(parsedLessonPlan['Guiding Questions for Educators to Reflect on and Improve their Lesson'])}

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


