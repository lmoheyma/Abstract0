import logoSrc from "@/assets/logo-abstract0.png";

const AbstractLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <img 
      src={logoSrc} 
      alt="Abstract0 logo" 
      className={`${className} invert brightness-0 invert transition-transform duration-500 ease-out hover:rotate-12`}
    />
  );
};

export default AbstractLogo;
