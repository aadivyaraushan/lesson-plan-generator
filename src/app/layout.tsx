import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css"
import { config } from "@fortawesome/fontawesome-svg-core";
import Head from "next/head";

config.autoAddCss = false;


export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <Head>
      <title>LessonGPT</title>
    </Head>
      <body>{children}</body>
    </html>
  );
}
