import { NavLink } from 'react-router-dom'
import './navbar.css'
import textLogo from '../../assets/images/text-logo.png'

function GlobalNavbar() {
	return (
		<header className="global-navbar">
			<NavLink className="global-navbar__brand" to="/" aria-label="Pear2Pear home">
				<img src={textLogo} alt="Pear2Pear" />
			</NavLink>
			<nav className="global-navbar__actions" aria-label="Account navigation">
				<NavLink className="global-navbar__signup" to="/user-registration">Sign Up</NavLink>
				<NavLink className="global-navbar__login" to="/login">Login</NavLink>
			</nav>
		</header>
	)
}

export default GlobalNavbar