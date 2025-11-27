import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/consultant/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/consultant/"!</div>
}
