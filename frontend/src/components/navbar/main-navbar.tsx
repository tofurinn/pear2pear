import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './navbar.css'
import textLogo from '../../assets/images/text-logo.png'

type MainNavbarProps = {
	dashboardPath?: string
	hasVolunteerAccess?: boolean
}

function getModePath(pathname: string, mode: 'student' | 'volunteer') {
	if (pathname === '/notifications') return pathname

	if (mode === 'volunteer') {
		if (pathname === '/student/request-form' || pathname.startsWith('/student/feedback-form/')) {
			return '/volunteer/dashboard'
		}
		return pathname.startsWith('/student/')
			? pathname.replace('/student/', '/volunteer/')
			: '/volunteer/dashboard'
	}

	return pathname.startsWith('/volunteer/')
		? pathname.replace('/volunteer/', '/student/')
		: '/student/dashboard'
}

function MainNavbar({ dashboardPath = '/student/dashboard', hasVolunteerAccess }: MainNavbarProps) {
	const location = useLocation()
	const navigate = useNavigate()
	const isVolunteer = dashboardPath.startsWith('/volunteer/')
	const canUseVolunteerMode = hasVolunteerAccess ?? isVolunteer

	const switchMode = (mode: 'student' | 'volunteer') => {
		if (mode === 'volunteer' && !canUseVolunteerMode) {
			navigate('/volunteer/dashboard', { state: { showVolunteerRegistrationPrompt: true } })
			return
		}

		const targetPath = getModePath(location.pathname, mode)
		navigate(targetPath, {
			state: targetPath === '/notifications'
				? { dashboardPath: mode === 'volunteer' ? '/volunteer/dashboard' : '/student/dashboard' }
				: undefined,
		})
	}

	return (
		<header className="global-navbar">
			<NavLink className="global-navbar__brand" to="/" aria-label="Pear2Pear home">
				<img src={textLogo} alt="Pear2Pear" />
			</NavLink>
			<nav className="global-navbar__actions" aria-label="Account navigation">
				{!isVolunteer && <NavLink className="global-navbar__signup" to="/student/request-form">Request</NavLink>}
				<NavLink className="global-navbar__login" to={isVolunteer ? '/volunteer/session-form' : '/student/session-form'}>Sessions</NavLink>
				<NavLink
					className="global-navbar__notification"
					to={isVolunteer ? '/volunteer/notifications' : '/student/notifications'}
					aria-label="Notifications"
					title="Notifications"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
					</svg>
				</NavLink>
				<div className="global-navbar__dashboard">
					<NavLink className="global-navbar__login" to={dashboardPath} end>Dashboard</NavLink>
					<details className="global-navbar__mode-switch">
						<summary aria-label="Switch dashboard mode" title="Switch dashboard mode">
							<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
								<path d="m3 6 5 5 5-5" />
							</svg>
						</summary>
						<div className="global-navbar__mode-options" aria-label="Dashboard modes">
							<button type="button" disabled={!isVolunteer} onClick={() => switchMode('student')}>
								Student
							</button>
							<button type="button" disabled={isVolunteer} onClick={() => switchMode('volunteer')}>
								Volunteer
							</button>
						</div>
					</details>
				</div>
			</nav>
		</header>
	)
}

export default MainNavbar