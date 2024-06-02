interface NotFoundProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}
const NotFound = ({ className, ...props }: NotFoundProps) => {
  return (
    <svg
      width="85"
      height="85"
      viewBox="0 0 85 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M77.5 0H7.5C3.358 0 0 3.358 0 7.5V77.5C0 81.642 3.358 85 7.5 85H77.5C81.642 85 85 81.642 85 77.5V7.5C85 3.358 81.642 0 77.5 0ZM77.5 77.5H7.5V27.5H77.5V77.5ZM77.5 22.5H7.5V7.5H77.5V22.5Z"
        fill="currentColor"
      />
      <path d="M52.5 12.5H47.5V17.5H52.5V12.5Z" fill="currentColor" />
      <path d="M62.5 12.5H57.5V17.5H62.5V12.5Z" fill="currentColor" />
      <path d="M72.5 12.5H67.5V17.5H72.5V12.5Z" fill="currentColor" />
      <path
        d="M22.5 57.5H27.5V62.5H32.5V42.5H27.5V52.5H22.5V42.5H17.5V52.5C17.5 55.257 19.743 57.5 22.5 57.5Z"
        fill="currentColor"
      />
      <path
        d="M57.5 57.5H62.5V62.5H67.5V42.5H62.5V52.5H57.5V42.5H52.5V52.5C52.5 55.257 54.743 57.5 57.5 57.5Z"
        fill="currentColor"
      />
      <path
        d="M42.5 62.5C46.636 62.5 50 59.136 50 55V50C50 45.864 46.636 42.5 42.5 42.5C38.364 42.5 35 45.864 35 50V55C35 59.136 38.364 62.5 42.5 62.5ZM40 50C40 48.622 41.122 47.5 42.5 47.5C43.878 47.5 45 48.622 45 50V55C45 56.378 43.878 57.5 42.5 57.5C41.122 57.5 40 56.378 40 55V50Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default NotFound;
