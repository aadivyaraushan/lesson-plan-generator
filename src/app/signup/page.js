"use client";
import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../../backend/firebase.js";
import { useRouter } from "next/navigation.js";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const onSubmitSignUp = async () => {
    const auth = getAuth(app);
    setErrorMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log(user);
      router.push("/generator");
    } catch (error) {
      if (error.code === "auth/weak-password") {
        setErrorMessage(
          error.message
            .replace("Firebase: ", "")
            .replace("(auth/weak-password).", "")
        );
      }
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-medium mr-12">Sign up</h1>
      <p className="text-xs mr-12">If you have already made an account, please log in instead.</p>
      <div className="flex flex-col justify-evenly items-end mr-12 w-1/2">
        <div>
          <label htmlFor={"email"} className={"mt-2 text-xl "}>
            Email:{" "}
          </label>
          <input
            type={"email"}
            id={"email"}
            className={"mt-2 p-1 rounded-md text-xl text-black"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={"password"} className={"mt-2 text-xl "}>
            Password:{" "}
          </label>
          <input
            type={"password"}
            id={"password"}
            className={"mt-2 p-1 rounded-md text-xl text-black"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className={"flex w-full items-center justify-center"}>
          <button
            className={"bg-white rounded-xl text-black p-2 mt-2"}
            onClick={onSubmitSignUp}
          >
            Sign Up
          </button>
        </div>
        {errorMessage !== "" && (
          <div className="bg-red-500 p-2 rounded-xl w-fit">{errorMessage}</div>
        )}
      </div>
    </main>
  );
};

export default Page;
