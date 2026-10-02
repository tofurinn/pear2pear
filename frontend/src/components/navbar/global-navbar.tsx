import './navbar.css'
import textLogo from '../../images/text-logo.png'

function GlobalNavbar() {
	return (
		<header className="global-navbar">
			<a className="global-navbar__brand" href="#home" aria-label="Pear2Pear home">
				<img src={textLogo} alt="Pear2Pear" width="135" height="104" />
			</a>
			<nav className="global-navbar__actions" aria-label="Account navigation">
				<a className="global-navbar__signup" href="/signup">Sign Up</a>
				<a className="global-navbar__login" href="/login">Login</a>
			</nav>
		</header>
	)
}

export default GlobalNavbar