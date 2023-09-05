'use client';
import React, { useState, createContext, useContext } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../backend/firebase.js';
import { useRouter } from 'next/navigation.js';

const LogIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const onSubmitLogIn = async () => {
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      router.push('/generator');
    } catch (e) {
      console.error('Error: ' + e.message);
      setErrorMessage(
        e.message
          .replace("Firebase: ", "")
      );    
    }
  };

  return (
    <div>
      <main className='flex min-h-screen w-full flex-col items-center justify-center p-24'>
        <h1 className='text-4xl font-medium mr-12'>Log in</h1>
        <div className='flex flex-col justify-evenly items-end mr-12'>
          <div>
            <label htmlFor={'email'} className={'mt-2 text-xl '}>
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
            <label htmlFor={'password'} className={'mt-2 text-xl '}>
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
          <div className={'flex w-full items-center justify-center'}>
            <button
              type={'submit'}
              className={'bg-white rounded-xl text-black p-2 mt-2'}
              onClick={onSubmitLogIn}
            >
              Log In
            </button>
          </div>
          {errorMessage !== '' && (
            <div className={'flex rounded-md bg-red-500 w-full items-center justify-center'}>
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
    </div>
  );
};

export default LogIn;
