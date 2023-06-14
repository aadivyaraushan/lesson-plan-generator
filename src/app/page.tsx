"use client";
import { useEffect, useState } from "react";
import {generatePDF, generateLessonPlan, parseRawLessonPlan, updateLessonPlan} from "@/utils";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";

type Detail = 'Medium' | 'High' | 'Low'

export default function Home() {
  const textStyle = 'text-xl text-left';
  const inputStyle = 'rounded-md text-black';
  const containerStyle = 'mb-2';

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState<Number>();
  const [detail, setDetail] = useState<string>('high');
  const [sessionNumber, setSessionNumber] = useState<Number>();
  const [sessionDuration, setSessionDuration] = useState<Number>();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isGeneratedLessonPlan, setIsGeneratedLessonPlan] = useState<boolean>(false);
  const [lessonPlanUpdate, setLessonPlanUpdate] = useState<string>('');
  const [lessonPlanUpdates, setLessonPlanUpdates] = useState<string[]>([]);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState<boolean>();
  const [isLoadingModify, setIsLoadingModify] = useState<boolean>(false);

  const onSubmit = async () => {
      // check if grade is >=1 and <= 12
      // verify that this is only going to be for grades 1-12 -> it is
      console.log(subject, topic, grade, detail)

      // @ts-ignore
      if(grade < 1 || grade > 12) {
        setErrorMessage('Invalid grade entered. Please enter some valid grade.')
        return;
      }

      if (sessionDuration <= 0) {
        setErrorMessage('Duration cannot be 0/negative. Please enter some valid duration.')
        return;
      }

      if (sessionNumber <= 0) {
        setErrorMessage('Number of sessions cannot be 0/negative. Please enter some valid number of sessions.')
        return;
      }


      setIsLoadingGenerate(true);
      const lessonPlan = await generateLessonPlan(subject, topic, String(grade), detail, `${sessionNumber} sessions for ${sessionDuration} minutes each`);
      console.log(lessonPlan);
      const parsedLessonPlan = parseRawLessonPlan(lessonPlan);
      console.log(parsedLessonPlan);
      generatePDF(parsedLessonPlan);
      setIsGeneratedLessonPlan(true);
      setIsLoadingGenerate(false);

  }

  const onSubmitModifications = async () => {
    let lessonPlanUpdatesTogether = '';
    for (let lessonPlanUpdate of lessonPlanUpdates) {
      lessonPlanUpdatesTogether += lessonPlanUpdate + '\n';
    }
    setIsLoadingModify(true);
    const lessonPlan = await updateLessonPlan(subject, topic, grade, detail, `${sessionNumber} sessions for ${sessionDuration} minutes each`, lessonPlanUpdatesTogether)
    console.log(lessonPlan)
    const parsedLessonPlan = parseRawLessonPlan(lessonPlan);
    console.log(parsedLessonPlan);
    generatePDF(parsedLessonPlan);
    setIsLoadingModify(false);
  }

  useEffect(() => {
    // @ts-ignore
    setLessonPlanUpdates(lessonPlanUpdates => [...lessonPlanUpdates, lessonPlanUpdate]);
  }, [lessonPlanUpdate])

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between p-24">
      <text className='absolute left-5 top-5 font-semibold text-xl'>LessonGPT</text>
      <div className=''>
          {/*{['subject', 'topic', 'grade', 'detail', 'duration'].map((inputField) => {*/}

          {/*    return <div className='mb-2'>*/}
          {/*      <text className='w-full text-right'>{inputField[0].toUpperCase() + inputField.slice(1)}: </text>*/}
          {/*      <input className='rounded-md bg-slate-200' type='text'/>*/}
          {/*    </div>*/}
          {/*})}*/}
          <div className={containerStyle}>
              <p className={textStyle}>Subject: </p>
              <input className={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)}/>
          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Topic: </p>
              <input className={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)}/>
          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Grade: </p>
            <div className='flex '>
              <input className={inputStyle} type={'range'} min={1} max={12} onChange={(e) => setGrade(Number(e.target.value))}/>
              <p className={'text-md ml-2'}>{grade}</p>
            </div>


          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Detail/Depth: </p>
              <select name='detail-level' id='detailLevel' className={inputStyle} value={detail} onChange={(e) => setDetail(e.target.value)}>
                  <option value='high'>High</option>
                  <option value='medium'>Medium</option>
                  <option value='low'>Low</option>
              </select>
          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Duration of a session (in minutes): </p>
              <input className={inputStyle} type={'number'} value={String(sessionDuration)} onChange={(e) => setSessionDuration(Number(e.target.value))}/>
          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Number of sessions: </p>
              <input className={inputStyle} type={'number'} value={String(sessionNumber)} onChange={(e) => setSessionNumber(Number(e.target.value))}/>
          </div>
        <div className='flex items-center'>
          <button onClick={onSubmit} className='bg-white text-black p-2 rounded-xl'>Generate Lesson Plan</button>
          {isLoadingGenerate &&
            <div
              className="inline-block ml-2 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
            <span
              className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
            >Loading...
            </span>
            </div>}
        </div>

          {errorMessage.length > 0 && (
              <div className='bg-red-300 p-4 rounded-xl text-white'>
                <p className='hover:cursor-pointer' onClick={() => setErrorMessage('')}>X</p>
                  <p>{errorMessage}</p>
              </div>
          )}
          {isGeneratedLessonPlan && (
              <div className='flex'>
                <input placeholder={'Write instructions for improvements'} type={'text'} className={'mt-2 p-2 bg-white text-black w-full rounded-xl'} value={lessonPlanUpdate} onChange={e => setLessonPlanUpdate(e.target.value)}/>
                  <FontAwesomeIcon onClick={onSubmitModifications} icon={faArrowAltCircleRight} className={'mt-2 ml-2 text-4xl '} />
                {isLoadingModify &&
                      <div
                        className="inline-block ml-2 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status">
                        <span
                          className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                        >Loading...
                        </span>
                      </div>}
              </div>
          )}
      </div>
    </main>
  )
}
