from manim import *

class MergeSortAnimation(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)
        numbers = [8, 3, 1, 7, 0, 10, 2, 5]
        num_rects = len(numbers)
        rects = []
        texts = []

        for i, num in enumerate(numbers):
            rect = Rectangle(width=0.5, height=0.5)
            text = Text(str(num))
            text.move_to(rect.get_center())
            group = VGroup(rect, text)
            group.move_to(LEFT * (num_rects / 2 - 0.5 - i) + UP * 2)
            rects.append(rect)
            texts.append(text)

        self.play(*[Create(rect) for rect in rects],
                  *[Create(text) for text in texts])
        self.wait(1)

        explanation = Text("Merge Sort: Divide and Conquer")
        explanation.move_to(DOWN * 2)
        self.play(Write(explanation))
        self.wait(2)
        self.play(FadeOut(explanation))

        # Example of splitting (simplified)
        split_line = Line(LEFT * (num_rects / 2 - 0.5), RIGHT * (num_rects / 2 - 0.5))
        self.play(Create(split_line))
        self.wait(1)
        self.play(FadeOut(split_line))

        # Example of merging (simplified)
        arrow = Arrow(start=LEFT * 1, end=RIGHT * 1, color=GREEN)
        arrow.move_to(DOWN * 1)
        merge_text = Text("Merge", color=GREEN)
        merge_text.next_to(arrow, UP)
        self.play(Create(arrow), Write(merge_text))
        self.wait(1)
        self.play(FadeOut(arrow), FadeOut(merge_text))

        sorted_numbers = sorted(numbers)
        sorted_texts = []
        for i, num in enumerate(sorted_numbers):
            text = Text(str(num))
            text.move_to(LEFT * (num_rects / 2 - 0.5 - i) + DOWN * 0)
            sorted_texts.append(text)

        self.play(*[Transform(texts[i], sorted_texts[i]) for i in range(num_rects)])
        self.wait(2)