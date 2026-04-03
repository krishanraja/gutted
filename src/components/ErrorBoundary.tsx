'use client'
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">😵</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-white/50 text-sm mb-6">An unexpected error occurred. Try refreshing the page.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] text-black font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
