import type { ReactNode } from "react";
import '../styles/components.css';

type HeaderProps = {
  title: string,
  children?: ReactNode,
  navigateText?: string,
  navigateUrl?:string,
  textButton: string
}

function Header(props: HeaderProps) {
  return (
    <header className="header">
      <div className="elementsRight">
        <div className="logoTitle">
          <img src="../assets" alt="logo" />
          <h3>{props.title}</h3>
          <p>{props.children}</p>
        </div> 
      </div>
      <div>
        <div>
          <a href={props.navigateUrl}>{props.navigateText}</a>
        </div>
        <div>
          <button>{props.textButton}</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
