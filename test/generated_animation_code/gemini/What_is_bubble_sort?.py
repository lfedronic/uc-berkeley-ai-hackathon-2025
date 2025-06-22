from manim import *

class BubbleSort(Scene):
    def construct(self):
        numbers = [5, 1, 4, 2, 8]
        rects = []
        texts = []
        for i, num in enumerate(numbers):
            rect = Square(side_length=1).shift(i * RIGHT)
            text = Text(str(num)).move_to(rect.get_center())
            rects.append(rect)
            texts.append(text)
            self.add(rect, text)

        for i in range(len(numbers)):
            for j in range(len(numbers) - i - 1):
                self.play(rects[j].animate.set_color(YELLOW),
                          rects[j+1].animate.set_color(YELLOW))
                self.wait(0.5)
                if numbers[j] > numbers[j+1]:
                    numbers[j], numbers[j+1] = numbers[j+1], numbers[j]
                    self.play(
                        rects[j].animate.shift(RIGHT),
                        rects[j+1].animate.shift(LEFT),
                        texts[j].animate.shift(RIGHT),
                        texts[j+1].animate.shift(LEFT)
                    )
                    rects[j], rects[j+1] = rects[j+1], rects[j]
                    texts[j], texts[j+1] = texts[j+1], texts[j]
                self.play(rects[j].animate.set_color(WHITE),
                          rects[j+1].animate.set_color(WHITE))
                self.wait(0.5)
            self.play(rects[len(numbers) - i - 1].animate.set_color(GREEN))
        self.play(rects[0].animate.set_color(GREEN))
        self.wait(1)