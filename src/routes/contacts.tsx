import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contacts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <h1>Контакты и адреса</h1>
    <p>
    8 908 446 6740 8 902 555 9405 8 908 448 6785 romavg@mail.ru</p>
  </div>
}
