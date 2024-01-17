'use client';
import { useEffect, useState } from 'react';
import ObjectivesUpload from '../components/ObjectivesUpload';
import {
  generateDOCX,
  generateLessonPlan,
  generateURLsFromLessonPlan,
} from '../../backend';
import { analytics, authentication, db, storage } from '@/backend/firebase';

// @ts-ignore
import fileSaver from 'file-saver';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import getVariables from '../getVariables';
import { getBlob, ref } from 'firebase/storage';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const router = useRouter();

  // @ts-ignore
  const onClickUpdates = async (event) => {
    setShowUpdates(true);
  };

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
    const userDocs = await getDocs(
      query(
        collection(db, 'users'),
        where('email', '==', authentication.currentUser.email)
      )
    );
    let schoolName;
    userDocs.forEach((userDoc) => {
      schoolName = userDoc.data().school;
      console.log(userDoc);
    });
    let numberOfVariables = 0;
    const schoolDocs = await getDocs(
      query(collection(db, 'schools'), where('name', '==', schoolName))
    );
    schoolDocs.forEach((schoolDoc) => {
      console.log('variables: ', schoolDoc.data().variables);
      for (let key in schoolDoc.data().variables) {
        numberOfVariables++;
      }
    });
    console.log('number of variables: ', numberOfVariables);
    const format = await getBlob(ref(storage, `${schoolName}.docx`));

    // const [lessonPlans, lessonPlansRaw] = await generateLessonPlan(
    //   teacherName,
    //   subject,
    //   chapterTitle,
    //   grade,
    //   section,
    //   lessonsNumber,
    //   learningObjectives,
    //   learningIntention,
    //   moralEducationObjectives,
    //   lessonsDuration,
    //   curriculum,
    //   includesTeacherStudentSplit,
    //   previousCoveredContent,
    //   schoolName
    // );
    const lessonPlans = [
      {
        teacher_name: 'Stephen Wolfram',
        subject: 'Computer Science',
        chapter_title: 'Nature of programming languages',
        grade: 11,
        section: 'B',
        lesson_number: 1,
        duration_in_minutes: 50,
        learning_intention:
          'To apply knowledge of programming to solve real life problems and model real life scenarios',
        learning_objective:
          'Students will be able to explain the essential features of a computer language and distinguish between fundamental and compound operations of a computer.',
        success_criteria:
          'Students can differentiate between fundamental and compound operations of a computer and explain the essential features of a computer language.',
        reference_to_prior_learning:
          'The teacher will review prior learning on solving logical questions with pseudocode.',
        lesson_introduction:
          'The teacher will introduce the lesson by discussing the importance of understanding the fundamental and compound operations of a computer language.',
        activity_one:
          'Students will participate in a group discussion to identify examples of fundamental and compound operations in a computer language.',
        assessment_one:
          "The teacher will assess students' understanding through a class discussion and individual explanations of fundamental and compound operations.",
        activity_two:
          'Students will work in pairs to create a presentation explaining the essential features of a computer language.',
        assessment_two:
          'Each pair will present their findings to the class, and the teacher will assess their understanding based on the accuracy and depth of their presentations.',
        moral_education_programme_integration:
          'During the group discussion, the teacher will encourage students to consider the ethical implications of different computer operations, promoting ethical decision-making and responsibility.',
        special_education_and_needs:
          'The teacher will provide additional support to students with special education needs by offering visual aids and extra explanation during the activities.',
        critical_thinking_question:
          'How can understanding the fundamental and compound operations of a computer language help us make ethical decisions in the digital world?',
        cross_curricular_link:
          'The teacher will create a cross-curricular link with TOK (Theory of Knowledge) by discussing the language and meaning of computer programming in relation to real-world applications.',
        resources: 'Computers, presentation materials',
        home_learning:
          'Students will research and write a short essay on the ethical considerations of using compound operations in computer programming, relating it to real-world examples. This will encourage students to think critically about the impact of programming on society.',
        high_order_questions:
          'How can the understanding of fundamental and compound operations in computer programming influence ethical decision-making? How do the essential features of a computer language contribute to its effectiveness?',
        medium_order_questions:
          'What are the examples of fundamental and compound operations in computer programming? How do the essential features of a computer language affect its functionality?',
        low_order_questions:
          'What are fundamental operations of a computer? What are compound operations of a computer?',
      },
      {
        teacher_name: 'Stephen Wolfram',
        subject: 'Computer Science',
        chapter_title: 'Nature of programming languages',
        grade: 11,
        section: 'B',
        lesson_number: 2,
        duration_in_minutes: 50,
        learning_intention:
          'To apply knowledge of programming to solve real life problems and model real life scenarios',
        learning_objective:
          'Students will be able to outline the need for higher level languages and explain the need for a translation process from a higher level language to machine executable code.',
        success_criteria:
          'Students can explain the need for higher level languages and outline the translation process from a higher level language to machine executable code.',
        reference_to_prior_learning:
          'The teacher will review prior learning on the essential features of a computer language and fundamental and compound operations of a computer.',
        lesson_introduction:
          'The teacher will introduce the lesson by discussing the evolution of computer languages and the need for higher level languages.',
        activity_one:
          'Students will participate in a role-playing activity where they act as different programming languages, demonstrating the differences between high and low-level languages.',
        assessment_one:
          "The teacher will assess students' understanding through their participation in the role-playing activity and their explanations of the differences between high and low-level languages.",
        activity_two:
          'In groups, students will create a flowchart to illustrate the translation process from a higher level language to machine executable code.',
        assessment_two:
          'Each group will present their flowchart to the class, and the teacher will assess their understanding based on the accuracy and completeness of their flowchart.',
        moral_education_programme_integration:
          'During the role-playing activity, the teacher will encourage students to consider the impact of language choice on accessibility and inclusivity, promoting empathy and understanding of diverse perspectives.',
        special_education_and_needs:
          'The teacher will provide additional support to students with special education needs by offering simplified language and step-by-step guidance during the activities.',
        critical_thinking_question:
          'How does the choice of programming language impact the inclusivity and accessibility of technology for different groups in society?',
        cross_curricular_link:
          'The teacher will create a cross-curricular link with TOK (Theory of Knowledge) by discussing the language and meaning of computer programming in relation to real-world applications.',
        resources: 'Computers, role-playing materials, flowchart templates',
        home_learning:
          'Students will research and write a short report on the impact of programming language choice on accessibility and inclusivity in technology. This will encourage students to consider the social implications of programming language decisions.',
        high_order_questions:
          'How does the choice of programming language impact the inclusivity and accessibility of technology? What are the implications of translating from a higher level language to machine executable code?',
        medium_order_questions:
          'What are the differences between high and low-level programming languages? How does the translation process from a higher level language to machine executable code work?',
        low_order_questions:
          'What are examples of high-level programming languages? What is the purpose of translating from a higher level language to machine executable code?',
      },
    ];
    console.log(lessonPlans);
    const lessonPlansRaw = `json
[
    {
        "teacher_name": "Stephen Wolfram",
        "subject": "Computer Science",
        "chapter_title": "Nature of programming languages",
        "grade": 11,
        "section": "B",
        "lesson_number": 1,
        "duration_in_minutes": 50,
        "learning_intention": "To apply knowledge of programming to solve real life problems and model real life scenarios",
        "learning_objective": "Students will be able to explain the essential features of a computer language and distinguish between fundamental and compound operations of a computer.",
        "success_criteria": "Students can differentiate between fundamental and compound operations of a computer and explain the essential features of a computer language.",
        "reference_to_prior_learning": "The teacher will review prior learning on solving logical questions with pseudocode.",
        "lesson_introduction": "The teacher will introduce the lesson by discussing the importance of understanding the fundamental and compound operations of a computer language.",
        "activity_one": "Students will participate in a group discussion to identify examples of fundamental and compound operations in a computer language.",
        "assessment_one": "The teacher will assess students' understanding through a class discussion and individual explanations of fundamental and compound operations.",
        "activity_two": "Students will work in pairs to create a presentation explaining the essential features of a computer language.",
        "assessment_two": "Each pair will present their findings to the class, and the teacher will assess their understanding based on the accuracy and depth of their presentations.",
        "moral_education_programme_integration": "During the group discussion, the teacher will encourage students to consider the ethical implications of different computer operations, promoting ethical decision-making and responsibility.",
        "special_education_and_needs": "The teacher will provide additional support to students with special education needs by offering visual aids and extra explanation during the activities.",
        "critical_thinking_question": "How can understanding the fundamental and compound operations of a computer language help us make ethical decisions in the digital world?",
        "cross_curricular_link": "The teacher will create a cross-curricular link with TOK (Theory of Knowledge) by discussing the language and meaning of computer programming in relation to real-world applications.",
        "resources": "Computers, presentation materials",
        "home_learning": "Students will research and write a short essay on the ethical considerations of using compound operations in computer programming, relating it to real-world examples. This will encourage students to think critically about the impact of programming on society.",
        "high_order_questions": "How can the understanding of fundamental and compound operations in computer programming influence ethical decision-making? How do the essential features of a computer language contribute to its effectiveness?",
        "medium_order_questions": "What are the examples of fundamental and compound operations in computer programming? How do the essential features of a computer language affect its functionality?",
        "low_order_questions": "What are fundamental operations of a computer? What are compound operations of a computer?"
    },
    {
        "teacher_name": "Stephen Wolfram",
        "subject": "Computer Science",
        "chapter_title": "Nature of programming languages",
        "grade": 11,
        "section": "B",
        "lesson_number": 2,
        "duration_in_minutes": 50,
        "learning_intention": "To apply knowledge of programming to solve real life problems and model real life scenarios",
        "learning_objective": "Students will be able to outline the need for higher level languages and explain the need for a translation process from a higher level language to machine executable code.",
        "success_criteria": "Students can explain the need for higher level languages and outline the translation process from a higher level language to machine executable code.",
        "reference_to_prior_learning": "The teacher will review prior learning on the essential features of a computer language and fundamental and compound operations of a computer.",
        "lesson_introduction": "The teacher will introduce the lesson by discussing the evolution of computer languages and the need for higher level languages.",
        "activity_one": "Students will participate in a role-playing activity where they act as different programming languages, demonstrating the differences between high and low-level languages.",
        "assessment_one": "The teacher will assess students' understanding through their participation in the role-playing activity and their explanations of the differences between high and low-level languages.",
        "activity_two": "In groups, students will create a flowchart to illustrate the translation process from a higher level language to machine executable code.",
        "assessment_two": "Each group will present their flowchart to the class, and the teacher will assess their understanding based on the accuracy and completeness of their flowchart.",
        "moral_education_programme_integration": "During the role-playing activity, the teacher will encourage students to consider the impact of language choice on accessibility and inclusivity, promoting empathy and understanding of diverse perspectives.",
        "special_education_and_needs": "The teacher will provide additional support to students with special education needs by offering simplified language and step-by-step guidance during the activities.",
        "critical_thinking_question": "How does the choice of programming language impact the inclusivity and accessibility of technology for different groups in society?",
        "cross_curricular_link": "The teacher will create a cross-curricular link with TOK (Theory of Knowledge) by discussing the language and meaning of computer programming in relation to real-world applications.",
        "resources": "Computers, role-playing materials, flowchart templates",
        "home_learning": "Students will research and write a short report on the impact of programming language choice on accessibility and inclusivity in technology. This will encourage students to consider the social implications of programming language decisions.",
        "high_order_questions": "How does the choice of programming language impact the inclusivity and accessibility of technology? What are the implications of translating from a higher level language to machine executable code?",
        "medium_order_questions": "What are the differences between high and low-level programming languages? How does the translation process from a higher level language to machine executable code work?",
        "low_order_questions": "What are examples of high-level programming languages? What is the purpose of translating from a higher level language to machine executable code?"
    }
]
`;
    let nestedUrls = [];
    if (includesWebsites) {
      nestedUrls = await generateURLsFromLessonPlan(
        lessonPlansRaw,
        lessonsNumber,
        numberOfVariables
      );

      // console.log(nestedUrls);
    }
    // for (let i = 1; i <= lessonsNumber; i++) {
    //   nestedUrls.push(['', '', '', '', '', '', '']);
    // }

    // TODO: Just add the last line of code and generate DOCX directly here and don't even have nested Urls exist.

    // console.log(nestedUrls);
    // console.log(authentication.currentUser?.email);
    // for (let i = 1; i <= lessonsNumber; i++) {
    //   logEvent(analytics, 'lesson_plan_generation', {
    //     subject,
    //     teacherName,
    //     chapterTitle,
    //     grade,
    //     section,
    //     lessonsNumber,
    //     moralEducationObjectives,
    //     lessonsDuration,
    //     curriculum,
    //     includesWebsites,
    //   });
    // }
    await generateDOCX(
      lessonPlans,
      nestedUrls,
      await format.arrayBuffer(),
      authentication.currentUser?.email,
      sendMethod
    );
    setIsLoadingGenerate(false);
  };

  useEffect(() => {
    onAuthStateChanged(authentication, (user) => {
      console.log(user);
      if (!user) {
        setIsLoggedIn(false);
        console.log('user logged out');
      } else {
        const determineAdmin = async (user) => {
          if (user) {
            const userDocs = await getDocs(
              query(collection(db, 'users'), where('email', '==', user.email))
            );
            userDocs.forEach((doc) => {
              if (doc.data().isAdmin) {
                setIsAdmin(true);
              }
            });
          }
        };
        determineAdmin(user);
      }
    });
  }, []);

  return (
    <>
      <main className='flex min-h-screen w-full flex-col items-center justify-between p-24'>
        <>
          <button onClick={() => router.push('/')}>
            <h1 className='absolute left-5 top-5 font-semibold text-xl'>
              LessonGPT
            </h1>
          </button>
          {isLoggedIn ? (
            <>
              {' '}
              <button onClick={onClickUpdates}>
                <h1 className='absolute right-5 top-5 font-semibold text-lg'>
                  Updates
                </h1>
              </button>
              {isAdmin && (
                <button onClick={() => router.push('/admin')}>
                  <h1 className='absolute right-28 top-5 font-semibold text-lg'>
                    View Admin Dashboard
                  </h1>
                </button>
              )}
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
                  <p className={textStyle}>
                    Duration of a lesson (in minutes):{' '}
                  </p>
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
                  <p className={textStyle}>
                    Learning intention in the syllabus:{' '}
                  </p>
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
                  <p className={textStyle}>
                    Include teacher-student split percent?{' '}
                  </p>
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
                            <br />• An option to receive the lesson plan by
                            email instead of directly receiving it as a download
                            on the website has been added (please note that you
                            still have to keep the window open in the background
                            while the leson plan is being generated).
                            <br />• A bug that was causing the generation of
                            multiple lesson plans at a time to fail in some
                            cases has been fixed.
                            <br />• A bug that was causing URLs to appear
                            incorrectly in lesson plans has been fixed.
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
              </form>{' '}
            </>
          ) : (
            <div className='flex flex-col justify-center items-center w-screen h-screen'>
              <h1 className='text-3xl font-semibold text-center p-12'>
                You have logged out or you may not be logged in. Please log in
                again by clicking the text on the top left.
              </h1>
            </div>
          )}
        </>
      </main>
    </>
  );
}
