import React from 'react';
interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}
const Image = ({
  src,
  alt,
  className,
  ...props
}: ImageProps) => {
  return;
};
export default Image;