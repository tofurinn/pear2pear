import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './navbar.css'
import '../ui.css'
import textLogo from '../../assets/images/text-logo.png'
import ConfirmPopup from '../popup/confirm-popup'
import { auth } from '../../firebase/config'
import { clear2FAVerified } from '../../firebase/verify-session'
import { useAuth } from '../../context/authContext'
import { subscribeToNotificationsByUser } from '../../services/NotificationService'

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
	const { userDoc } = useAuth()
	const UID = userDoc?.UID ?? null
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [logoutError, setLogoutError] = useState('')
	const [unreadNotificationCount, setUnreadNotificationCount] = useState<{
		UID: string
		count: number
	} | null>(null)
	const isVolunteer = dashboardPath.startsWith('/volunteer/')
	const canUseVolunteerMode = hasVolunteerAccess ?? isVolunteer
	const unreadCount = UID && unreadNotificationCount?.UID === UID
		? unreadNotificationCount.count
		: 0

	useEffect(() => {
		if (!UID) return

		return subscribeToNotificationsByUser(
			UID,
			notifications => {
				setUnreadNotificationCount({
					UID,
					count: notifications.filter(notification => !notification.isRead).length,
				})
			},
			error => {
				console.error('Could not load unread notification count:', error)
			},
		)
	}, [UID])

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

	const confirmLogout = async () => {
		setIsLoggingOut(true)
		setLogoutError('')

		try {
			await signOut(auth)
			clear2FAVerified()
			setShowLogoutConfirm(false)
			navigate('/login', { replace: true })
		} catch (error) {
			console.error('Error logging out:', error)
			setLogoutError('Could not log out. Please try again.')
		} finally {
			setIsLoggingOut(false)
		}
	}

	const cancelLogout = () => {
		if (isLoggingOut) return
		setShowLogoutConfirm(false)
		setLogoutError('')
	}

	return (
		<>
			<header className="global-navbar">
				<NavLink 
					className="global-navbar__brand" 
					to=	{isVolunteer ? '/volunteer/dashboard' : '/student/dashboard'}
					aria-label="Pear2Pear home"
					>
					<img src={textLogo} alt="Pear2Pear" />
				</NavLink>
				<nav className="global-navbar__actions" aria-label="Account navigation">
					<NavLink
						className="global-navbar__signup"
						to={isVolunteer ? '/volunteer/my-requests' : '/student/my-requests'}
					>
						{isVolunteer ? 'Requests' : 'Requests'}
					</NavLink>
					<NavLink className="global-navbar__login" to={isVolunteer ? '/volunteer/my-sessions' : '/student/my-sessions'}>Sessions</NavLink>
					<NavLink
						className="global-navbar__notification"
						to={isVolunteer ? '/volunteer/notifications' : '/student/notifications'}
						aria-label={unreadCount > 0
							? `Notifications, ${unreadCount} unread`
							: 'Notifications'}
						title={unreadCount > 0
							? `Notifications (${unreadCount} unread)`
							: 'Notifications'}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
						</svg>
						{unreadCount > 0 && (
							<span className="global-navbar__notification-count" aria-hidden="true">
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</NavLink>
					<div className="global-navbar__dashboard">
						<NavLink className="global-navbar__login" to={dashboardPath} end>Dashboard</NavLink>
						<details className="global-navbar__mode-switch">
							<summary aria-label="Dashboard menu" title="Dashboard menu">
								<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
									<path d="m3 6 5 5 5-5" />
								</svg>
							</summary>
							<div className="global-navbar__mode-options" aria-label="Dashboard options">
								<button type="button" disabled={!isVolunteer} onClick={() => switchMode('student')}>
									Student
								</button>
								<button type="button" disabled={isVolunteer} onClick={() => switchMode('volunteer')}>
									Volunteer
								</button>
								<button
									type="button"
									className="global-navbar__logout"
									onClick={() => {
										setLogoutError('')
										setShowLogoutConfirm(true)
									}}
								>
									Log out
								</button>
							</div>
						</details>
					</div>
				</nav>
			</header>
			{showLogoutConfirm && (
				<div className="global-navbar__logout-popup">
					<ConfirmPopup
						open
						title="Log out?"
						message={logoutError
							? <span role="alert">{logoutError}</span>
							: 'Are you sure you want to log out?'}
						confirmLabel="Log out"
						busy={isLoggingOut}
						busyLabel="Logging out…"
						onConfirm={() => void confirmLogout()}
						onCancel={cancelLogout}
					/>
				</div>
			)}
		</>
	)
}

export default MainNavbar