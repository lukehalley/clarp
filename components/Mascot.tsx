import Clarp from './Clarp';

export default function Mascot() {
  return (
    <div className="relative">
      {/* Hard shadow instead of glow */}
      <div
        className="absolute inset-0 bg-danger-orange translate-x-4 translate-y-4"
        style={{ width: 200, height: 200 }}
      />

      {/* Mascot - static, confrontational */}
      <div className="relative">
        {/* Harsh scanlines */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-40">
          <div
            className="w-full h-full"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 6px)',
            }}
          />
        </div>

        {/* CLARP - raw, no effects */}
        <Clarp size={200} />

      </div>
    </div>
  );
}
