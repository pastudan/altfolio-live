import React, {Component} from 'react';
import lasso from './images/lasso.svg';
import './Header.css';

class Header extends Component {
  state = {mounted: false};

  componentDidMount() {
    setTimeout(() => {
      this.setState({mounted: true})
    }, 0);
  }

  render() {
    return <header className={`Header ${this.state.mounted ? ' mounted' : ''}`}>
      <div className="Header-container">
        <img src={lasso} alt="header icon"/>
        <h1>altfolio</h1>
      </div>
    </header>
  }
}

export default Header;
