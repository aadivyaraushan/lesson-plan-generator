'use client';
import { FormEventHandler, useEffect, useState, useTransition } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowAltCircleRight,
  faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import Head from 'next/head';
import { generateTextFromImage } from '../../backend';
import ObjectivesUpload from '../components/ObjectivesUpload';
import {
  generateDOCX,
  generateLessonPlan,
  generateURLsFromLessonPlan,
} from '../../backend';
import {
  sampleNestedUrls,
  sampleLessonPlanRaw,
  sampleLessonPlans,
} from '../../sampleOutput';

// @ts-ignore
import fileSaver from 'file-saver';
const { saveAs } = fileSaver;

export default function Generator() {
  const textStyle = 'text-xl text-left';
  const inputStyle = 'p-1 rounded-md text-black';
  const containerStyle = 'mb-2';

  const [grade, setGrade] = useState<number>(1);
  const [lessonsNumber, setLessonsNumber] = useState<number>(0);
  const [subject, setSubject] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [curriculum, setCurriculum] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [lessonsDuration, setLessonsDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lessonPlanUpdate, setLessonPlanUpdate] = useState<string>('');
  const [isLoadingGenerate, setIsLoadingGenerate] = useState<boolean>(false);
  const [previousCoveredContent, setPreviousCoveredContent] =
    useState<string>('');

  const [learningObjectives, setLearningObjectives] = useState('');
  const [learningObjectivesImage, setLearningObjectivesImage] =
    useState<File>();
  const [moralEducationObjectives, setMoralEducationObjectives] = useState('');
  const [moralEducationObjectivesImage, setMoralEducationObjectivesImage] =
    useState<File>();
  const [includesWebsites, setIncludesWebsites] = useState<boolean>(false);
  const [includesTeacherStudentSplit, setIncludesTeacherStudentSplit] =
    useState<boolean>(false);

  useEffect(() => {
    // console.log(learningObjectives);
  }, [learningObjectives]);
  // @ts-ignore
  const onSubmit = async (event) => {
    event.preventDefault();
    // @ts-ignore
    if (grade < 1 || grade > 12) {
      setErrorMessage('Invalid grade entered. Please enter some valid grade.');
      return;
    }

    if (lessonsDuration <= 0) {
      setErrorMessage(
        'Duration cannot be 0/negative. Please enter some valid duration.'
      );
      return;
    }

    if (lessonsNumber <= 0) {
      setErrorMessage(
        'Number of sessions cannot be 0/negative. Please enter some valid number of sessions.'
      );
      return;
    }
    setIsLoadingGenerate(true);

    const [lessonPlans, lessonPlansRaw] = await generateLessonPlan(
      teacherName,
      subject,
      chapterTitle,
      grade,
      section,
      lessonsNumber,
      learningObjectives,
      moralEducationObjectives,
      lessonsDuration,
      curriculum,
      includesTeacherStudentSplit,
      previousCoveredContent
    );
    let nestedUrls: Array<Array<string>> = [];
    if (includesWebsites) {
      nestedUrls = await generateURLsFromLessonPlan(
        lessonPlansRaw,
        lessonsNumber
      );
    } else {
      for (let i = 1; i <= lessonsNumber; i++) {
        nestedUrls.push(['', '', '', '', '', '', '']);
      }
    }
    // console.log(nestedUrls);
    await generateDOCX(lessonPlans, nestedUrls);
    setIsLoadingGenerate(false);
  };

  return (
    <>
      <Head>
        <title>LessonJS</title>
        <meta property='og:title' content='LessonGPT' key='title' />
      </Head>
      <main className='flex min-h-screen w-full flex-col items-center justify-between p-24'>
        <h1 className='absolute left-5 top-5 font-semibold text-xl'>
          LessonGPT
        </h1>
        <form onSubmit={onSubmit}>
          <div className={containerStyle}>
            <p className={textStyle}>Subject: </p>
            <input
              className={inputStyle}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Chapter: </p>
            <input
              className={inputStyle}
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Curriculum: </p>
            <input
              className={inputStyle}
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Teacher: </p>
            <input
              className={inputStyle}
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Grade: </p>
            <div className='flex '>
              <input
                className={inputStyle}
                type={'range'}
                min={1}
                max={12}
                onChange={(e) => setGrade(Number(e.target.value))}
                value={grade}
              />
              <p className={'text-md ml-2'}>{grade}</p>
            </div>
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Section: </p>
            <input
              className={inputStyle}
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Duration of a lesson (in minutes): </p>
            <input
              className={inputStyle}
              type={'number'}
              value={String(lessonsDuration)}
              onChange={(e) => setLessonsDuration(Number(e.target.value))}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Number of sessions: </p>
            <input
              className={inputStyle}
              type={'number'}
              value={String(lessonsNumber)}
              onChange={(e) => setLessonsNumber(Number(e.target.value))}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Previously covered content: </p>
            <input
              className={inputStyle}
              value={previousCoveredContent}
              onChange={(e) => setPreviousCoveredContent(e.target.value)}
            />
          </div>
          <ObjectivesUpload
            textStyle={textStyle}
            inputStyle={inputStyle}
            containerStyle={containerStyle}
            prompt={'Learning objectives in the syllabus'}
            name='learningObjectives'
            imageText={learningObjectives}
            setImageText={setLearningObjectives}
            image={learningObjectivesImage}
            setImage={setLearningObjectivesImage}
            setErrorMessage={setErrorMessage}
          />
          <ObjectivesUpload
            textStyle={textStyle}
            inputStyle={inputStyle}
            containerStyle={containerStyle}
            prompt='Moral Education Learning Outcomes:'
            name='moralEdOutcomes'
            imageText={moralEducationObjectives}
            setImageText={setMoralEducationObjectives}
            image={moralEducationObjectivesImage}
            setImage={setMoralEducationObjectivesImage}
            setErrorMessage={setErrorMessage}
          />
          <div className={containerStyle}>
            <p className={textStyle}>Include website links? </p>
            <input
              className={inputStyle}
              type={'checkbox'}
              value={'Use weblinks'}
              onChange={(e) => {
                setIncludesWebsites(e.target.value === 'Use weblinks');
              }}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Include teacher-student split percent? </p>
            <input
              className={inputStyle}
              type={'checkbox'}
              value={'Use teacher-student split %'}
              onChange={(e) => {
                setIncludesTeacherStudentSplit(
                  e.target.value === 'Use teacher-student split %'
                );
              }}
            />
          </div>
          <div className='flex items-center'>
            <button
              className='bg-white text-black p-2 rounded-xl'
              type='submit'
            >
              Generate Lesson Plan
            </button>
            {isLoadingGenerate && (
              <div
                className='inline-block ml-2 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
                role='status'
              >
                <span className='!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]'>
                  Loading...
                </span>
              </div>
            )}
          </div>

          {errorMessage.length > 0 && (
            <div className='bg-red-300 p-4 rounded-xl text-white'>
              <p
                className='hover:cursor-pointer'
                onClick={() => setErrorMessage('')}
              >
                X
              </p>
              <p>{errorMessage}</p>
            </div>
          )}
        </form>
      </main>
    </>
  );
}
