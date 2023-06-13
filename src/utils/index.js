"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = exports.parseRawLessonPlan = exports.generateLessonPlan = void 0;
var openai_1 = require("langchain/chat_models/openai");
var langchain_1 = require("langchain");
var prompts_1 = require("langchain/prompts");
var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var model = new openai_1.ChatOpenAI({ temperature: 0.5 });
var lessonPromptTemplateText = "\nGenerate a lesson plan given the following context:\n\nSubject: {subject}\nTopic: {topic}\nGrade: {grade}\nDetail: {detailLevel}\nDuration: {duration}\n\n\nInclude, in key/value pairs:\n- Lesson plan\n- Subject\n- Grade\n- Date\n- Duration\n- Key vocabulary\n- Supporting materials and resources\n- Learning outcomes through Knowledge\n- Learning outcomes through skills\n- Learning outcomes through understandings\n- Modifications for students who need extra support\n- Modifications for extra challenge\n- Preparation of learning by students\n- Planning of learning by students\n- Learning by investigation by students\n- Application of learning by students\n- Connection of learning to personal, local and global situations by students\n- Evaluation and reflection on learning by students\n- Assessment of learning by students\n\n\nAlso, include guiding questions for educators to reflect on and improve their lesson.\nDon't write numbered list. Write bulleted lists.\n";
var lessonPromptTemplate = prompts_1.ChatPromptTemplate.fromPromptMessages([
    prompts_1.SystemMessagePromptTemplate.fromTemplate('You are a helpful assistant that generates lesson plans based on any given context and modifies lesson plans based on user input'),
    prompts_1.HumanMessagePromptTemplate.fromTemplate(lessonPromptTemplateText)
]);
var chain = new langchain_1.LLMChain({ llm: model, prompt: lessonPromptTemplate });
var generateLessonPlan = function (subject, topic, grade, detailLevel, duration) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('generateLessonPlan running');
                return [4 /*yield*/, chain.call({ subject: subject, topic: topic, grade: grade, detailLevel: detailLevel, duration: duration })];
            case 1:
                response = _a.sent();
                console.log('response generated');
                return [2 /*return*/, response.text];
        }
    });
}); };
exports.generateLessonPlan = generateLessonPlan;
var parseRawLessonPlan = function (rawLessonPlan) {
    var parsedLessonPlan = {};
    var planComponents = rawLessonPlan.split('\n');
    var currentKey = null;
    for (var i = 0; i < planComponents.length; i++) {
        var planComponent = planComponents[i];
        if (planComponent == '')
            continue;
        else {
            var isKeyValueComponent = planComponent.includes(':');
            var isListComponent = planComponent.startsWith('- ');
            if (isKeyValueComponent) {
                var _a = planComponent.split(':'), key = _a[0], value = _a[1];
                key = key.trim();
                key = key.replace('- ', '');
                value = value.trim();
                parsedLessonPlan[key] = value;
                currentKey = key;
            }
            else if (isListComponent && currentKey) {
                var value = planComponent.replace('- ', '').trim();
                if (!parsedLessonPlan[currentKey])
                    parsedLessonPlan[currentKey] = [];
                // @ts-ignore
                parsedLessonPlan[currentKey].push(value);
            }
        }
    }
    return parsedLessonPlan;
};
exports.parseRawLessonPlan = parseRawLessonPlan;
// (async () => {
//     const rawLessonPlan = await generateLessonPlan('math', 'calculus', '11', 'high', '20 hours');
//     console.log(rawLessonPlan)
//     // console.log(parseRawLessonPlan(rawLessonPlan));
// })()
var createTable = function (body) {
    return {
        headerRows: 0,
        widths: ['*', 'auto'],
        body: body
    };
};
var generateList = function (array) {
    var output = '';
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var element = array_1[_i];
        output += '● ' + element + '\n';
    }
    return output;
};
var generateTableHeader = function (text) {
    return { text: text, style: 'sub-sub-header' };
};
var generatePDF = function (parsedLessonPlan) {
    var docDefinition = {
        content: [
            { text: parsedLessonPlan['Lesson Plan'], style: 'header' },
            { text: parsedLessonPlan['Subject'], style: 'sub-header' },
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
            { text: 'Guiding questions for teachers to reflect' },
            { text: generateList(parsedLessonPlan['Guiding Questions for Educators to Reflect on and Improve their Lesson']) }
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
    };
    pdfMake.createPdf(docDefinition).download('sample.pdf');
};
exports.generatePDF = generatePDF;
// generatePDF(parseRawLessonPlan(sampleLessonPlan));
