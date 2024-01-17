'use client';
import { useEffect, useState } from 'react';
import ObjectivesUpload from '../components/ObjectivesUpload';
import {
  generateDOCX,
  generateLessonPlan,
  generateURLsFromLessonPlan,
} from '../../backend';
import { analytics, authentication, db } from '@/backend/firebase';

// @ts-ignore
import fileSaver from 'file-saver';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { storage } from '@/backend/firebase';
import { uploadBytes, ref } from 'firebase/storage';
import docxToString from '../docxToString';
import getVariables from '../getVariables';
import { match } from 'assert';
const { saveAs } = fileSaver;

export default function Generator() {
  const textStyle = 'text-xl text-left';
  const inputStyle = 'p-1 rounded-md text-black w-full';
  const containerStyle = '';

  const [isAdmin, setIsAdmin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const router = useRouter();
  // const [variables, setVariables] = useState([]); // Initial state with one empty input
  const [format, setFormat] = useState();
  const [uploaded, setUploaded] = useState(true);
  const [variables, setVariables] = useState([]);
  const [variableDescriptions, setVariableDescriptions] = useState({});

  useEffect(() => {
    console.log(variableDescriptions);
  }, [variableDescriptions]);

  const handleFileChange = (e) => {
    console.log('handle file change running');
    const files = Array.from(e.target.files);
    console.log(files[0]);
    setFormat(files[0]);
    const updateVariables = async () => {
      const [variables, variablesStr] = await getVariables(files[0]);
      console.log(variables);
      setVariables(variables);
    };
    console.log(format);
    updateVariables();
  };

  useEffect(() => {
    console.log(variables);
  }, [variables]);

  const handleInputChange = (index, value) => {
    const newInputValues = [...variables];
    newInputValues[index] = value;
    setVariables(newInputValues);
  };

  const handleAddInput = () => {
    setVariables([...variables, '']);
  };

  const handleRemoveInput = (index) => {
    const newInputValues = [...variables];
    newInputValues.splice(index, 1);
    setVariables(newInputValues);
  };

  const handleSubmit = async (e) => {
    if (authentication.currentUser) {
      setUploaded(false);
      // find school name of user
      let schoolName = '';
      const email = authentication.currentUser.email;
      const userDocs = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      );
      userDocs.forEach((userDoc) => {
        schoolName = userDoc.data().school;
      });

      // upload format with school name
      const formatRef = ref(storage, `${schoolName}.docx`);
      const fileSnapshot = await uploadBytes(formatRef, format, {
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      console.log(`uploaded format with name ${schoolName}.docx`);
      setUploaded(true);

      // upload variables with description to schools database
      const docRef = await addDoc(collection(db, 'schools'), {
        name: schoolName,
        variables: variableDescriptions,
      });
      console.log('uploaded variables with descriptions to firebase');
    }
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
      <main className='flex min-h-screen w-full flex-col items-start justify-center p-12'>
        <>
          <button onClick={() => router.push('/')}>
            <h1 className='absolute left-5 top-5 font-semibold text-xl'>
              LessonGPT
            </h1>
          </button>
          <button onClick={() => router.push('/generator')}>
            <h1 className='absolute right-5 top-5 font-semibold text-xl'>
              Return to Generator
            </h1>
          </button>
          {isAdmin && isLoggedIn && (
            <>
              <div className={`${containerStyle} mb-10`}></div>
              <div className={`${containerStyle} mb-10`}>
                <p className={textStyle}>
                  Upload your lesson plan format with variables (as a word
                  file):
                </p>
                <input
                  type='file'
                  className='font-sm'
                  accept='.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  onChange={(e) => handleFileChange(e)}
                />
                <p className={`${textStyle}`}>
                  A variable refers to some piece of information that must be
                  "filled in" by the generative AI in the lesson plan format.
                  These variables should be enclosed in curly brackets in the
                  format's word document. For example, a variable could be
                  'teacher_name' and it would be written in the lesson plan
                  format as {' {teacher_name}'}
                </p>
              </div>
              <div className={containerStyle}>
                <p className={textStyle}>
                  Please enter a description of what each variable means. Be as
                  specific as possible.
                </p>
                {variables.length !== 0 &&
                  variables.map((variable) => {
                    return (
                      <div>
                        <p className={textStyle}>{variable}: </p>
                        <input
                          className={inputStyle}
                          onChange={(e) =>
                            setVariableDescriptions({
                              ...variableDescriptions,
                              [variable]: e.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
              </div>

              <div className={`${containerStyle} mb-10`}>
                <button
                  className='bg-white text-black p-2 rounded-xl'
                  type='submit'
                  onClick={(e) => handleSubmit(e)}
                >
                  Submit changes
                </button>
                {!uploaded && (
                  <>
                    <div
                      className='inline-block ml-2 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
                      role='status'
                    >
                      <span className='!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]'>
                        Loading...
                      </span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          {!isAdmin && isLoggedIn && (
            <>
              <div className='flex flex-col justify-center items-center w-screen h-screen'>
                <h1 className='text-3xl font-semibold text-center p-12'>
                  You do not have access to this page. Please click the text on
                  the top left to return to the app.
                </h1>
              </div>
            </>
          )}
          {!isLoggedIn && (
            <>
              <div className='flex flex-col justify-center items-center w-screen h-screen'>
                <h1 className='text-3xl font-semibold text-center p-12'>
                  You have logged out or you may not be logged in. Please log in
                  again by clicking the text on the top left.
                </h1>
              </div>
            </>
          )}
        </>
      </main>
    </>
  );
}
