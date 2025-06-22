
from manim import *

class BubbleSortAnimation(Scene):
    def construct(self):
        array = [5, 1, 4, 2, 8]
        n = len(array)

        # 1. Initialize Array and Title
        title = Text("Bubble Sort Animation").to_edge(UP, buff=0.5).set_color(YELLOW)
        self.add(title)

        array_elements = VGroup()
        for i, num in enumerate(array):
            number = Integer(num)
            rectangle = Rectangle(width=1, height=1).surround(number).set_fill(color=WHITE, opacity=0)
            element_group = VGroup(rectangle, number)
            array_elements.add(element_group)

        array_elements.arrange(RIGHT, buff=0.5).to_edge(DOWN)
        self.play(Create(array_elements))

        # Function to get rectangle color
        def get_rect_color(index):
            return array_elements[index][0].get_fill_color()

        # Function to set rectangle color
        def set_rect_color(index, color):
            array_elements[index][0].set_fill(color=color, opacity=1)

        # 2. Outer Loop (Passes)
        for i in range(n - 1):
            pass_text = Text(f"Pass {i + 1}").to_edge(UP)
            self.play(FadeIn(pass_text))
            self.wait(0.5)

            # Inner Loop (Comparisons and Swaps)
            for j in range(n - i - 1):
                num1 = array[j]
                num2 = array[j+1]
                # Highlight elements being compared (RED)
                set_rect_color(j, RED)
                set_rect_color(j + 1, RED)

                comparison_text = Text(f"Comparing {num1} and {num2}").move_to(UP)
                self.play(FadeIn(comparison_text))
                self.wait(0.5)

                # If swap needed:
                if array[j] > array[j + 1]:
                    swap_text = Text(f"Swapping {num1} and {num2}").move_to(UP)
                    self.play(FadeIn(swap_text))
                    self.wait(0.5)

                    # Animate swap (Transform positions)
                    self.play(Transform(array_elements[j], array_elements[j+1].copy()), Transform(array_elements[j+1], array_elements[j].copy()))

                    # Update the array values
                    array[j], array[j + 1] = array[j + 1], array[j]
                    # Change color of swapped elements (e.g., momentarily GREEN, then back to default)
                    set_rect_color(j, GREEN)
                    set_rect_color(j + 1, GREEN)
                    self.wait(0.5)
                    set_rect_color(j, WHITE)
                    set_rect_color(j + 1, WHITE)
                    self.wait(0.5)
                    self.play(FadeOut(swap_text))

                # Else (no swap):
                else:
                    self.wait(0.5)
                    self.play(FadeOut(comparison_text))

                # After comparison/potential swap, change the color of array[j] and array[j+1] back to the default color.
                set_rect_color(j, WHITE)
                set_rect_color(j + 1, WHITE)
                self.wait(0.3)

            # Mark the largest element of this pass as sorted (GREEN)
            set_rect_color(n - i - 1, GREEN)

            self.play(FadeOut(pass_text))

        # 3. Final State: All elements GREEN, "Array Sorted!" text
        for i in range(n):
            set_rect_color(i, GREEN)
        array_sorted_text = Text("Array Sorted!").move_to(UP)
        self.play(FadeIn(array_sorted_text))
        self.wait(2)
