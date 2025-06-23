from manim import *

class BubbleSortExplanation(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)
        numbers = [5, 1, 4, 2, 8]
        rects = []
        texts = []

        for i, num in enumerate(numbers):
            rect = Rectangle(width=0.7, height=0.7)
            text = Text(str(num))
            text.move_to(rect.get_center())
            rect.shift(RIGHT * i)
            text.shift(RIGHT * i)
            rects.append(rect)
            texts.append(text)
            self.add(rect)
            self.add(text)

        self.wait(0.5)

        n = len(numbers)
        for i in range(n):
            for j in range(0, n-i-1):
                self.play(rects[j].animate.set_color(YELLOW), rects[j+1].animate.set_color(YELLOW))
                self.wait(0.5)

                if numbers[j] > numbers[j+1]:
                    self.play(rects[j].animate.set_color(RED), rects[j+1].animate.set_color(RED))
                    self.wait(0.5)

                    numbers[j], numbers[j+1] = numbers[j+1], numbers[j]

                    rects[j], rects[j+1] = rects[j+1], rects[j]
                    texts[j], texts[j+1] = texts[j+1], texts[j]

                    self.play(
                        rects[j].animate.shift(LEFT),
                        rects[j+1].animate.shift(RIGHT),
                        texts[j].animate.shift(LEFT),
                        texts[j+1].animate.shift(RIGHT)
                    )

                    rects[j], rects[j+1] = rects[j+1], rects[j]
                    texts[j], texts[j+1] = texts[j+1], texts[j]

                    self.play(
                        rects[j].animate.shift(RIGHT),
                        rects[j+1].animate.shift(LEFT),
                        texts[j].animate.shift(RIGHT),
                        texts[j+1].animate.shift(LEFT)
                    )

                    self.play(rects[j].animate.set_color(WHITE), rects[j+1].animate.set_color(WHITE))
                    self.wait(0.5)
                else:
                    self.play(rects[j].animate.set_color(WHITE), rects[j+1].animate.set_color(WHITE))
                    self.wait(0.5)

        self.wait(1)