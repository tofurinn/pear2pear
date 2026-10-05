import { NavLink } from 'react-router-dom'
import './navbar.css'
import textLogo from '../../assets/images/text-logo.png'

type MainNavbarProps = {
	dashboardPath?: string
}

function MainNavbar({ dashboardPath = '/student/dashboard' }: MainNavbarProps) {
	return (
		<header className="global-navbar">
			<NavLink className="global-navbar__brand" to="/" aria-label="Pear2Pear home">
				<img src={textLogo} alt="Pear2Pear" />
			</NavLink>
			<nav className="global-navbar__actions" aria-label="Account navigation">
				<NavLink className="global-navbar__signup" to="/request-form">Request</NavLink>
				<NavLink className="global-navbar__login" to="/session-form">Session</NavLink>
				<NavLink
					className="global-navbar__notification"
					to="/notifications"
					aria-label="Notifications"
					title="Notifications"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
					</svg>
				</NavLink>
				<NavLink className="global-navbar__login" to={dashboardPath} end>Dashboard</NavLink>
			</nav>
		</header>
	)
}

export default MainNavbar