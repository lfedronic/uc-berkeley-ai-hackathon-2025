from manim import *

class QuickSortExplanation(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)

        numbers = [5, 2, 8, 1, 9, 4, 7, 6, 3]
        rectangles = []
        texts = []

        for i, num in enumerate(numbers):
            rect = Rectangle(width=0.5, height=0.5)
            text = Text(str(num))
            text.move_to(rect.get_center())
            rect.shift(RIGHT * i * 0.6)
            text.shift(RIGHT * i * 0.6)
            rectangles.append(rect)
            texts.append(text)

        rect_group = VGroup(*rectangles)
        text_group = VGroup(*texts)

        self.play(Create(rect_group), Create(text_group))
        self.wait(1)

        pivot_index = 0
        pivot_rect = rectangles[pivot_index].copy()
        pivot_rect.set_color(RED)
        pivot_text = texts[pivot_index].copy()
        pivot_text.set_color(RED)

        self.play(Create(pivot_rect), Create(pivot_text))
        self.wait(1)

        i = 1
        j = len(numbers) - 1

        i_arrow = Arrow(start=DOWN, end=DOWN + LEFT * 0.3)
        i_arrow.next_to(rectangles[i], DOWN)
        i_text = Text("i")
        i_text.next_to(i_arrow, DOWN)

        j_arrow = Arrow(start=DOWN, end=DOWN + RIGHT * 0.3)
        j_arrow.next_to(rectangles[j], DOWN)
        j_text = Text("j")
        j_text.next_to(j_arrow, DOWN)

        self.play(Create(i_arrow), Create(i_text), Create(j_arrow), Create(j_text))
        self.wait(1)

        # Simplified swap animation
        self.play(
            rectangles[i].animate.move_to(rectangles[j].get_center()),
            rectangles[j].animate.move_to(rectangles[i].get_center()),
            texts[i].animate.move_to(texts[j].get_center()),
            texts[j].animate.move_to(texts[i].get_center())
        )

        rectangles[i], rectangles[j] = rectangles[j], rectangles[i]
        texts[i], texts[j] = texts[j], texts[i]

        self.wait(1)

        self.play(
            rectangles[pivot_index].animate.move_to(rectangles[j].get_center()),
            rectangles[j].animate.move_to(rectangles[pivot_index].get_center()),
            texts[pivot_index].animate.move_to(texts[j].get_center()),
            texts[j].animate.move_to(texts[pivot_index].get_center())
        )

        rectangles[pivot_index], rectangles[j] = rectangles[j], rectangles[pivot_index]
        texts[pivot_index], texts[j] = texts[j], texts[pivot_index]

        self.wait(1)

        self.play(FadeOut(pivot_rect), FadeOut(pivot_text), FadeOut(i_arrow), FadeOut(i_text), FadeOut(j_arrow), FadeOut(j_text))
        self.wait(1)

        sorted_rect_group = VGroup(*rectangles)
        sorted_text_group = VGroup(*texts)

        self.play(sorted_rect_group.animate.arrange(RIGHT), sorted_text_group.animate.arrange(RIGHT))

        self.wait(2)