'use client';
import { useEffect, useState } from 'react';
import ObjectivesUpload from '../components/ObjectivesUpload';
import {
  generateDOCX,
  generateLessonPlan,
  generateURLsFromLessonPlan,
} from '../../backend';
import { analytics, authentication } from '@/backend/firebase';

// @ts-ignore
import fileSaver from 'file-saver';
import { getAnalytics, logEvent } from 'firebase/analytics';
const { saveAs } = fileSaver;

export default function Generator() {
  const textStyle = 'text-xl text-left';
  const inputStyle = 'p-1 rounded-md text-black';
  const containerStyle = 'mb-2';

  const [grade, setGrade] = useState(1);
  const [lessonsNumber, setLessonsNumber] = useState(0);
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [lessonsDuration, setLessonsDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [lessonPlanUpdate, setLessonPlanUpdate] = useState('');
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [previousCoveredContent, setPreviousCoveredContent] = useState('');
  const [learningIntention, setLearningIntention] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [learningObjectivesImage, setLearningObjectivesImage] = useState();
  const [moralEducationObjectives, setMoralEducationObjectives] = useState('');
  const [moralEducationObjectivesImage, setMoralEducationObjectivesImage] =
    useState();
  const [includesWebsites, setIncludesWebsites] = useState(false);
  const [includesTeacherStudentSplit, setIncludesTeacherStudentSplit] =
    useState(false);
  const [learningIntentionImage, setLearningIntentionImage] = useState();
  const [showUpdates, setShowUpdates] = useState(false);
  const [sendMethod, setSendMethod] = useState('directDownload');

  // @ts-ignore
  const onClickUpdates = async (event) => {
    setShowUpdates(true);
  };

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
    // console.log(includesTeacherStudentSplit);
    const [lessonPlans, lessonPlansRaw] = await generateLessonPlan(
      teacherName,
      subject,
      chapterTitle,
      grade,
      section,
      lessonsNumber,
      learningObjectives,
      learningIntention,
      moralEducationObjectives,
      lessonsDuration,
      curriculum,
      includesTeacherStudentSplit,
      previousCoveredContent
    );

    //   const lessonPlansRaw = `
    //   Lesson Plan 1:
    //   - Teacher name: Shruti Talwar
    // - Subject: Physics
    // - Chapter title: Work, power and energy
    // - Grade: 11
    // - Section: A
    // - Duration: 50 minutes
    // - Learning intention of the entire ongoing chapter / unit: To apply knowledge of work, power and energy to solve real-life problems and predict outcomes in real-life scenarios.
    // - Learning objective of the lesson: Students will be able to define and differentiate between kinetic energy, gravitational potential energy, and elastic potential energy.
    // - Success criteria:
    //   1. Students can accurately define kinetic energy, gravitational potential energy, and elastic potential energy.
    //   2. Students can provide examples of each type of energy.
    //   3. Students can calculate the kinetic energy, gravitational potential energy, and elastic potential energy in given scenarios.
    // - Method of linking back to and reviewing learning in prior lessons with teacher-student split percentage: The teacher will review the concept of forces and momentum by asking students to recall the definition of force and explain how it relates to the concept of work. (70% teacher-led, 30% student-led)
    // - Method of introducing the lesson with teacher-student split percentage: The teacher will introduce the concept of energy by asking students to brainstorm different types of energy they encounter in their daily lives. (60% teacher-led, 40% student-led)
    // - First activity (lower order activity) with teacher-student split percentage: Students will work in pairs to create a concept map showing the different types of energy and their relationships. (50% teacher-led, 50% student-led)
    // - First assessment (lower order assessment) with teacher-student split percentage: Students will complete a worksheet where they match different scenarios with the appropriate type of energy. (30% teacher-led, 70% student-led)
    // - Second activity (higher order activity) with teacher-student split percentage: Students will work in groups to design and conduct an experiment to determine the relationship between the height of a falling object and its gravitational potential energy. (40% teacher-led, 60% student-led)
    // - Second assessment (higher order assessment) with teacher-student split percentage: Students will write a short essay explaining the concept of energy conservation and how it applies to real-life scenarios. (20% teacher-led, 80% student-led)
    // - Integration into Moral Education Programme: During the second activity, students will discuss the importance of conserving energy and how their experiment relates to sustainable practices. By exploring the concept of energy conservation, students will develop a sense of responsibility towards the environment.
    // - Methods to assist students with special education needs and students with disabilities: Provide visual aids, such as diagrams and illustrations, to support understanding. Use hands-on materials and manipulatives for tactile learners. Provide additional time and support for students who may need it.
    // - Critical thinking question of the class: How can the concept of energy conservation be applied to everyday life to promote sustainability?
    // - Cross-curricular links in the class: This lesson connects to the Biology topics of energy in living organisms and the Chemistry topics of energy changes in chemical reactions.
    // - Resources to use in the class: Textbooks, concept maps, worksheets, experiment materials (e.g., objects of different heights, measuring tools), writing materials.
    // - Home learning for the class content and how the home learning will be assessed by the teachers: Students will research and write a short paragraph on a real-life example of energy conservation. The teacher will assess the home learning through a class discussion where students share their examples.
    // - Higher order sample questions for tests/exams:
    //   1. Explain the principle of conservation of energy and provide an example to support your explanation.
    //   2. Analyze the factors that affect the efficiency of energy transfers and discuss their importance in various systems.
    // - Medium order sample questions for tests/exams:
    //   1. Calculate the kinetic energy of an object with a mass of 2 kg and a velocity of 5 m/s.
    //   2. Compare and contrast gravitational potential energy and elastic potential energy.
    // - Lower order sample questions for tests/exams:
    //   1. Define kinetic energy.
    //   2. Give an example of an object with elastic potential energy.
    //   `
    //   const nestedUrls = [[
    //     "https://www.vedantu.com/question-answer/relation-between-force-and-momentum-class-11-physics-cbse-5f59b25c6e663a29ccae8866#:~:text=Momentum%20measures%20the%20content%20of,product%20of%20mass%20and%20acceleration.",
    //     "https://www.vedantu.com/physics/forms-of-energy",
    //     "",
    //     "",
    //     "",
    //     "",
    //     ""
    // ]]
    let nestedUrls = [];
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
    console.log(authentication.currentUser?.email);
    for (let i = 1; i <= lessonsNumber; i++) {
      logEvent(analytics, 'lesson_plan_generation', {
        subject,
        teacherName,
        chapterTitle,
        grade,
        section,
        lessonsNumber,
        moralEducationObjectives,
        lessonsDuration,
        curriculum,
        includesWebsites,
      });
    }
    await generateDOCX(
      lessonPlans,
      nestedUrls,
      '',
      authentication.currentUser?.email,
      sendMethod
    );
    setIsLoadingGenerate(false);
  };

  return (
    <>
      <main className='flex min-h-screen w-full flex-col items-center justify-between p-24'>
        <h1 className='absolute left-5 top-5 font-semibold text-xl'>
          LessonGPT
        </h1>
        <button onClick={onClickUpdates}>
          <h1 className='absolute right-5 top-5 font-semibold text-lg'>
            Updates
          </h1>
        </button>
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
            <p className={textStyle}>Topic/Unit: </p>
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
            {
              // PYP MYP DP ICSE ISC
            }
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Teacher name: </p>
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
            <p className={textStyle}>Total number of periods: </p>
            <input
              className={inputStyle}
              type={'number'}
              value={String(lessonsNumber)}
              onChange={(e) => setLessonsNumber(Number(e.target.value))}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Prior relevant learning : </p>
            <p className={' text-xs'}>
              (list a topic / sub-topic linked to the current topic)
            </p>
            <input
              className={inputStyle}
              value={previousCoveredContent}
              onChange={(e) => setPreviousCoveredContent(e.target.value)}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Learning intention in the syllabus: </p>
            <input
              className={inputStyle}
              value={learningIntention}
              onChange={(e) => setLearningIntention(e.target.value)}
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
          <div className={containerStyle}>
            <p className={textStyle}>Recieve lesson plans by: </p>
            <input
              type='radio'
              value='directDownload'
              checked={sendMethod === 'directDownload'}
              onChange={(e) => {
                setSendMethod(e.target.value);
              }}
            />
            <label>Direct download on this website</label>
            <br />
            <input
              type='radio'
              value='email'
              checked={sendMethod === 'email'}
              onChange={(e) => setSendMethod(e.target.value)}
            />
            <label>Email</label>
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
            <div className='bg-red-500 p-4 rounded-xl text-white'>
              <p
                className='hover:cursor-pointer'
                onClick={() => setErrorMessage('')}
              >
                X
              </p>
              <p>{errorMessage}</p>
            </div>
          )}
          {showUpdates && (
            <>
              <div className='fixed inset-0 overflow-y-auto'>
                <div className='fixed inset-0 bg-black opacity-25'></div>
                <div className='flex items-center justify-center min-h-screen'>
                  <div className='relative bg-white p-8 max-w-md mx-auto rounded-xl'>
                    <h2 className='text-2xl font-bold mb-4'>Updates</h2>
                    <p className='text-gray-700 mb-6'>
                      27th December 2023:
                      <br />• An option to receive the lesson plan by email
                      instead of directly receiving it as a download on the
                      website has been added (please note that you still have to
                      keep the window open in the background while the leson
                      plan is being generated).
                      <br />• A bug that was causing the generation of multiple
                      lesson plans at a time to fail in some cases has been
                      fixed.
                      <br />• A bug that was causing URLs to appear incorrectly
                      in lesson plans has been fixed.
                    </p>
                    <button
                      className='absolute top-0 right-0 p-2'
                      onClick={() => setShowUpdates(false)}
                    >
                      <svg
                        className='h-6 w-6 text-gray-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          stroke-width='2'
                          d='M6 18L18 6M6 6l12 12'
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </main>
    </>
  );
}
