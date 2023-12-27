import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');
import fs from 'fs';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');
  const teacherName = searchParams.get('teacherName');
  const text = searchParams.get('text');
  const userEmail = searchParams.get('userEmail');
  const lessonSubject = searchParams.get('lessonSubject');
  const topic = searchParams.get('topic');
  const attachments = [];

  const data = await request.formData();
  const lessonPlans = data.getAll('lesson plans');
  console.log(
    subject,
    teacherName,
    text,
    userEmail,
    lessonSubject,
    topic,
    attachments,
    lessonPlans
  );

  const buffers = [];
  // async function convertDocxToArrayBuffer(file) {
  //   return new Promise((resolve, reject) => {
  //     reader.onload = () => {
  //       const buffer = (reader.result);
  //       resolve(buffer);
  //     };

  //     reader.onerror = reject;
  //     reader.readAsArrayBuffer(file);
  //   });
  // }

  for (let lessonPlan of lessonPlans) {
    // const buffer = await convertDocxToArrayBuffer(lessonPlan);
    // const buffer = await fs.readFile(lessonPlan);
    const arrayBuffer = await lessonPlan.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('length of buffer: ', buffer.length);
    console.log('size of file: ', lessonPlan.size);
    buffers.push(buffer);
  }

  for (let i = 0; i < buffers.length; i++) {
    console.log('buffer size: ', buffers[i].length, ' bytes');
    attachments.push({
      filename: `${teacherName} – ${lessonSubject}, ${topic} – Lesson ${
        i + 1
      }.docx`,
      content: buffers[i],
      encoding: 'base64',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'lessongpt@dxbmodern.com',
        pass: process.env.NEXT_PUBLIC_LESSON_GPT_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'lessongpt@dxbmodern.com',
      to: userEmail,
      subject,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Lesson plan emailed with message id ', info.messageId);
  } catch (error) {
    console.error('There is an error: ', error.message);
    return Response.json({ status: 500 });
  }
  return Response.json({ status: 200 });
}
