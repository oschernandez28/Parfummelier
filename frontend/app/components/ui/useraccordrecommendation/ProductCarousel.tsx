import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card/Card";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Recommendation {
  id: number;
  name: string;
  brand: string;
  accords: string[];
  imageURL: string | null;
  match_ratio: number;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const ProductCarousel = ({ recommendations }: RecommendationsProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Personal Recommendations
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Based on your favorite accords
          </p>
        </div>

        <div className="relative">
          {/* Carousel navigation buttons */}
          <button
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg ${
              !prevBtnEnabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg ${
              !nextBtnEnabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {recommendations.map((product) => (
                <div key={product.id} className="flex-[0_0_280px]">
                  <Link href={`/products/${encodeURIComponent(product.name)}`}>
                    <Card className="transition-all duration-200 hover:shadow-lg h-full">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">
                          {product.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {product.brand}
                        </p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="relative w-full aspect-[3/4] mb-2">
                          {product.imageURL ? (
                            <Image
                              src={product.imageURL}
                              alt={product.name}
                              fill
                              className="rounded-md object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = "none";
                                target.parentElement?.classList.add(
                                  "error-state",
                                );
                              }}
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">
                                No image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.accords.slice(0, 3).map((accord, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                            >
                              {accord}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          Match: {product.match_ratio}%
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
