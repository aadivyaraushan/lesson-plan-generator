"use client";
import { useState } from "react";
import { generateLessonPlan, generateDOCX } from "@/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";

export default function Home() {
  const textStyle = "text-xl text-left";
  const inputStyle = "p-1 rounded-md text-black";
  const containerStyle = "mb-2";

  const [subject, setSubject] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [grade, setGrade] = useState<Number>();
  const [section, setSection] = useState("");
  const [detail, setDetail] = useState<string>("high");
  const [lessonsNumber, setLessonsNumber] = useState<Number>();
  const [lessonsDuration, setLessonsDuration] = useState<Number>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGeneratedLessonPlan, setIsGeneratedLessonPlan] =
    useState<boolean>(false);
  const [lessonPlanUpdate, setLessonPlanUpdate] = useState<string>("");
  const [isLoadingGenerate, setIsLoadingGenerate] = useState<boolean>();
  const [curriculum, setCurriculum] = useState("");
  const [teacherName, setTeacherName] = useState<string>("");
  const [learningObjectives, setLearningObjectives] = useState("");

  const onSubmit = async () => {
    // check if grade is >=1 and <= 12
    // verify that this is only going to be for grades 1-12 -> it is
    // console.log(subject, topic, grade, detail)

    // @ts-ignore
    if (grade < 1 || grade > 12) {
      setErrorMessage("Invalid grade entered. Please enter some valid grade.");
      return;
    }

    if (lessonsDuration <= 0) {
      setErrorMessage(
        "Duration cannot be 0/negative. Please enter some valid duration."
      );
      return;
    }

    if (lessonsNumber <= 0) {
      setErrorMessage(
        "Number of sessions cannot be 0/negative. Please enter some valid number of sessions."
      );
      return;
    }

    setIsLoadingGenerate(true);
    const lessonPlan = await generateLessonPlan(
      teacherName,
      subject,
      chapterTitle,
      grade,
      section,
      lessonsNumber,
      learningObjectives,
      lessonsDuration,
      curriculum
    );
    generateDOCX(lessonPlan);
    // const parsedLessonPlan = parseRawLessonPlan(lessonPlan);
    // console.log(parsedLessonPlan);
    // generatePDF(parsedLessonPlan);
    setIsGeneratedLessonPlan(true);
    setIsLoadingGenerate(false);
  };

  return (
    <>
      <Head>
        <title>LessonJS</title>
        <meta property="og:title" content="LessonGPT" key="title" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center justify-between p-24">
        <text className="absolute left-5 top-5 font-semibold text-xl">
          LessonGPT
        </text>
        <div className="">
          {/*{['subject', 'topic', 'grade', 'detail', 'duration'].map((inputField) => {*/}

          {/*    return <div className='mb-2'>*/}
          {/*      <text className='w-full text-right'>{inputField[0].toUpperCase() + inputField.slice(1)}: </text>*/}
          {/*      <input className='rounded-md bg-slate-200' type='text'/>*/}
          {/*    </div>*/}
          {/*})}*/}
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
            <div className="flex ">
              <input
                className={inputStyle}
                type={"range"}
                min={1}
                max={12}
                onChange={(e) => setGrade(Number(e.target.value))}
              />
              <p className={"text-md ml-2"}>{grade}</p>
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
              type={"number"}
              value={String(lessonsDuration)}
              onChange={(e) => setLessonsDuration(Number(e.target.value))}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Number of sessions: </p>
            <input
              className={inputStyle}
              type={"number"}
              value={String(lessonsNumber)}
              onChange={(e) => setLessonsNumber(Number(e.target.value))}
            />
          </div>
          <div className={containerStyle}>
            <p className={textStyle}>Learning objectives in the syllabus: </p>
            <textarea
              rows={10}
              cols={20}
              name="learning_objectives"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={onSubmit}
              className="bg-white text-black p-2 rounded-xl"
            >
              Generate Lesson Plan
            </button>
            {isLoadingGenerate && (
              <div
                className="inline-block ml-2 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            )}
          </div>

          {errorMessage.length > 0 && (
            <div className="bg-red-300 p-4 rounded-xl text-white">
              <p
                className="hover:cursor-pointer"
                onClick={() => setErrorMessage("")}
              >
                X
              </p>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
