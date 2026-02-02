export const Footer = () => {
  return (
    <footer className="border-t py-6 bg-muted/30">
      <div className="container flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Mandi App. Todos os direitos
          reservados.
        </p>
        <p>Desenvolvido com foco em privacidade e saúde.</p>
      </div>
    </footer>
  )
}
