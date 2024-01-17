'use client';
import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../backend/firebase.js';
import { useRouter } from 'next/navigation.js';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../backend/firebase.js';
import { db } from '../../backend/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

const Page = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [schoolName, setSchoolName] = useState('gems modern academy');
  const router = useRouter();

  const onSubmitSignUp = async () => {
    const auth = getAuth(app);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await addDoc(collection(db, 'users'), {
        email,
        isAdmin: false,
        school: schoolName,
      });
      logEvent(analytics, 'sign_up', {
        email,
      });

      router.push('/generator');
    } catch (error) {
      console.error(error.message);
      setErrorMessage(error.message.replace('Firebase: ', ''));
    }
  };

  useEffect(() => {
    console.log(schoolName);
  }, [schoolName]);

  return (
    <main className='flex min-h-screen w-full flex-col items-center justify-center p-24'>
      <h1 className='text-4xl font-medium mr-12'>Sign up</h1>
      <p className='text-xs mr-12'>
        If you have already made an account, please log in instead.
      </p>
      <div className='  flex flex-col justify-between items-end '>
        <div>
          <label htmlFor={'email'} className={'text-xl '}>
            Email:{' '}
          </label>
          <input
            type={'email'}
            id={'email'}
            className={'mt-2 p-1 rounded-md text-xl text-black'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={'password'} className={'text-xl '}>
            Password:{' '}
          </label>
          <input
            type={'password'}
            id={'password'}
            className={'mt-2 p-1 rounded-md text-xl text-black'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={'schoolName'} className={'text-xl '}>
            School name:{' '}
          </label>

          <select
            name='schoolName'
            id='schoolName'
            className={'text-xl rounded-md text-black mt-2 p-1 w-56'}
            onChange={(e) => {
              setSchoolName(e.target.value);
            }}
            value={schoolName}
          >
            <option value='gems modern academy'>GEMS Modern Academy</option>
            <option value='NMS'>NMS</option>
          </select>
        </div>
        <div className={'flex w-full items-center justify-center'}>
          <button
            className={'bg-white rounded-xl text-black p-2 mt-2'}
            onClick={onSubmitSignUp}
          >
            Sign Up
          </button>
        </div>
        {errorMessage != '' && (
          <div
            className={
              'flex rounded-md bg-red-500 w-full items-center justify-center'
            }
          >
            <p
              className='hover:cursor-pointer mr-5'
              onClick={() => setErrorMessage('')}
            >
              X
            </p>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
