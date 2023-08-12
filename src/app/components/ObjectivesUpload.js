import { useEffect } from 'react';
import { generateTextFromImage } from '../../backend/index';

const ObjectivesUpload = ({
  textStyle,
  inputStyle,
  containerStyle,
  prompt,
  name,
  imageText,
  setImageText,
  image,
  setImage,
  setErrorMessage,
}) => {
  useEffect(() => {
    console.log('image: ', image);
    const generateImageTextFromImage = async () => {
      if (image?.type.slice(0, 5) === 'image') {
        const tempText = await generateTextFromImage(image);
        setImageText((imageText) => imageText + tempText);
      } else if (image != null || image != undefined) {
        setErrorMessage('Please upload a valid image file.');
      }
    };

    generateImageTextFromImage();
  }, [image]);

  return (
    <div className={containerStyle}>
      <p className={textStyle}>{prompt}</p>
      <textarea
        rows={10}
        cols={20}
        name={name}
        value={imageText}
        onChange={(e) => setImageText(e.target.value)}
        className={inputStyle}
      />
      {/* <p className={textStyle}>or upload screenshots:</p>
      <input
        type='file'
        id='learningObjectivesScreenshot'
        className={inputStyle}
        accept='image/png image/jpeg'
        onChange={(e) => setImage(e.target.files[0])}
      /> */}
    </div>
  );
};

export default ObjectivesUpload;
