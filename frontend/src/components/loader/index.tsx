import { HTMLAttributes } from "react";

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  className?: string;
}
const Loader = ({ message, className, ...props }: LoaderProps) => {
  return (
    <div className={className} {...props}>
      <style>
        {`
        .loader {
          width: 55px;
          aspect-ratio: 1;
          --g1:conic-gradient(from  90deg at 3px  3px ,#0000 90deg,#007acc 0);
          --g2:conic-gradient(from -90deg at 22px 22px,#0000 90deg,#007acc 0);
          background:var(--g1),var(--g1),var(--g1), var(--g2),var(--g2),var(--g2);
          background-size: 25px 25px;
          background-repeat: no-repeat;
          animation: l7 1.5s infinite;
        }
        @keyframes l7 {
          0%   {background-position:0    0   ,0 100%,100% 100% }
          25%  {background-position:100% 0   ,0 100%,100% 100% }
          50%  {background-position:100% 0   ,0 0   ,100% 100% }
          75%  {background-position:100% 0   ,0 0   ,0    100% }
          100% {background-position:100% 100%,0 0   ,0    100% }
        }
      `}
      </style>
      <div className="flex flex-col items-center gap-2 flex-1 w-full h-full justify-center">
        <div>{message}</div>
        <div className="loader" />
      </div>
    </div>
  );
};

export default Loader;
