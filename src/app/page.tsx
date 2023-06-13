"use client";
import {useState} from "react";
import {generatePDF, generateLessonPlan, parseRawLessonPlan} from "@/utils";

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

  const onSubmit = () => {
      // check if grade is >=1 and <= 12
      // verify that this is only going to be for grades 1-12 -> it is
      console.log(subject, topic, grade, detail)

      // @ts-ignore
      if(grade < 1 || grade > 12) {
        setErrorMessage('Invalid grade entered. Please enter some valid grade.')
        return;
      }

      generateLessonPlan(subject, topic, String(grade), detail, `${sessionNumber} sessions for ${sessionDuration} minutes each`);


  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
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
              <input className={inputStyle} type={'number'} onChange={(e) => setGrade(Number(e.target.value))}/>
          </div>
          <div className={containerStyle}>
              <p className={textStyle}>Detail: </p>
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
          <button onClick={onSubmit} className='bg-white text-black p-2 rounded-xl'>Generate Lesson Plan</button>
          {errorMessage.length > 0 && (
              <div className='bg-red-300 p-4 rounded-xl text-white'>
                  <p>{errorMessage}</p>
              </div>
          )}
      </div>
    </main>
  )
}
