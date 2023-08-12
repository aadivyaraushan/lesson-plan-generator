"use client";
import { useRouter } from "next/navigation.js";
import React, { useState } from "react";

const Home = () => {
  const router = useRouter();
  const onSignUp = () => {
    router.push("/signup");
  };

  const onLogIn = () => {
    router.push("/login");
  };

  return (
    <div>
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-24">
        <h1 className={"text-4xl font-medium mb-4"}>Welcome!</h1>
        <button
          className="bg-white p-2 text-black rounded-xl mb-2"
          onClick={onSignUp}
        >
          Sign Up
        </button>
        <button
          className="bg-white p-2 text-black rounded-xl"
          onClick={onLogIn}
        >
          Log In
        </button>
      </main>
    </div>
  );
};

export default Home;
