interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="badge badge-critical inline-flex w-fit">
      {message}
    </div>
  );
}
