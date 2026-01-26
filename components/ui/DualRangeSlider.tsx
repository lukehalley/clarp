'use client';

import * as Slider from '@radix-ui/react-slider';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export default function DualRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
}: DualRangeSliderProps) {
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none w-full h-5"
      value={value}
      onValueChange={(val) => onChange(val as [number, number])}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={1}
    >
      <Slider.Track className="bg-ivory-light/20 relative grow h-1">
        <Slider.Range className="absolute bg-danger-orange h-full" />
      </Slider.Track>
      <Slider.Thumb
        className="block w-4 h-4 bg-danger-orange border-2 border-black shadow-[2px_2px_0_black] hover:bg-danger-orange/90 focus:outline-none focus:ring-2 focus:ring-danger-orange/50 cursor-grab active:cursor-grabbing"
        aria-label="Min value"
      />
      <Slider.Thumb
        className="block w-4 h-4 bg-danger-orange border-2 border-black shadow-[2px_2px_0_black] hover:bg-danger-orange/90 focus:outline-none focus:ring-2 focus:ring-danger-orange/50 cursor-grab active:cursor-grabbing"
        aria-label="Max value"
      />
    </Slider.Root>
  );
}
