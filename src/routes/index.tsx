import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../modules/landing/components/LandingPage'

export const Route = createFileRoute('/')({ component: LandingPage })
