export default function Card({ className='', ...props }){
  return (
    <div
      className={`rounded-lg border bg-white shadow-sm hover:shadow-md transition ${className}`}
      {...props}
    />
  );
}