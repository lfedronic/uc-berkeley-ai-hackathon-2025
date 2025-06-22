
from manim import *

class BubbleSortAnimation(Scene):
    CONFIG = {
        "array": [5, 1, 4, 2, 8],
        "DEFAULT_COLOR": BLUE_C,
        "COMPARE_COLOR": YELLOW,
        "SWAP_COLOR": RED,
        "SORTED_COLOR": GREEN_C,
        "TEXT_COLOR": WHITE,
        "POINTER_COLOR": PURPLE,
        "BAR_WIDTH": 0.8,
        "BAR_HEIGHT_SCALE": 0.6,
        "BAR_SPACING": 0.3,
        "VERTICAL_SPACING": 0.5,
    }

    def construct(self):
        # Constants for easier access
        array = self.array
        n = len(array)
        bar_width = self.BAR_WIDTH
        bar_height_scale = self.BAR_HEIGHT_SCALE
        bar_spacing = self.BAR_SPACING

        # --- Scene Setup ---
        title = Text("Bubble Sort Algorithm Visualization", color=self.TEXT_COLOR, font_size=36).to_edge(UP*3.5)
        operation_text = Text("", color=self.TEXT_COLOR, font_size=28).to_edge(UP*2.5)

        # Create initial array elements (VGroup of Rectangle and Text)
        element_vgroups = VGroup()
        rectangles = VGroup()
        texts = VGroup()

        max_val = max(array)

        for i, value in enumerate(array):
            bar_height = value * bar_height_scale
            rect = Rectangle(width=bar_width, height=bar_height, color=self.DEFAULT_COLOR, fill_opacity=1)
            text = Text(str(value), color=self.TEXT_COLOR, font_size=24)
            text.move_to(rect.get_center())

            v_group = VGroup(rect, text)
            element_vgroups.add(v_group)
            rectangles.add(rect)
            texts.add(text)

        # Arrange elements horizontally
        element_vgroups.arrange(buff=bar_spacing)
        element_vgroups.move_to(ORIGIN)

        # Align bases of rectangles
        for i in range(n):
            element_vgroups[i].submobjects[0].align_to(element_vgroups[i], DOWN)
            element_vgroups[i].submobjects[1].move_to(element_vgroups[i].get_center())

        # --- Initial State ---
        self.play(FadeIn(title), FadeIn(operation_text))
        self.play(FadeIn(element_vgroups))
        operation_text.set_value("Initial Unsorted Array")
        self.wait(1.5)

        # --- Bubble Sort Algorithm Animation ---
        for i in range(n - 1):
            # Update operation text for the pass
            operation_text.set_value(f"Pass {i+1} of {n-1}")
            self.wait(1)

            # Pointers for comparison
            j_pointer = Arrow(buff=0.1).set_color(self.POINTER_COLOR)
            j_plus_1_pointer = Arrow(buff=0.1).set_color(self.POINTER_COLOR)

            # Add pointers before inner loop if not already there (first pass)
            if i == 0:
                self.add(j_pointer, j_plus_1_pointer)

            for j in range(n - 1 - i):
                # Move pointers
                j_pointer.move_to(element_vgroups[j].get_center() + DOWN * (element_vgroups[j].get_height()/2 + j_pointer.get_height()/2 + self.VERTICAL_SPACING))
                j_plus_1_pointer.move_to(element_vgroups[j+1].get_center() + DOWN * (element_vgroups[j+1].get_height()/2 + j_plus_1_pointer.get_height()/2 + self.VERTICAL_SPACING))

                # --- Highlight Comparison ---
                self.play(
                    element_vgroups[j].submobjects[0].animate.set_color(self.COMPARE_COLOR),
                    element_vgroups[j+1].submobjects[0].animate.set_color(self.COMPARE_COLOR),
                    operation_text.animate.set_value(f"Comparing {array[j]} and {array[j+1]}"),
                    run_time=0.8
                )
                self.wait(0.5)

                # --- Conditional Swap ---
                if array[j] > array[j+1]:
                    operation_text.set_value(f"Swap required: {array[j]} > {array[j+1]}")
                    self.play(
                        element_vgroups[j].submobjects[0].animate.set_color(self.SWAP_COLOR),
                        element_vgroups[j+1].submobjects[0].animate.set_color(self.SWAP_COLOR),
                        run_time=0.4
                    )

                    # Perform Swap animation
                    self.play(
                        Swap(element_vgroups[j], element_vgroups[j+1]),
                        run_time=0.8
                    )

                    # Update the actual array and re-center text after swap
                    array[j], array[j+1] = array[j+1], array[j]
                    element_vgroups[j].submobjects[1].move_to(element_vgroups[j].get_center())
                    element_vgroups[j+1].submobjects[1].move_to(element_vgroups[j+1].get_center())

                    # Briefly revert colors after swap to compare color
                    self.play(
                        element_vgroups[j].submobjects[0].animate.set_color(self.COMPARE_COLOR),
                        element_vgroups[j+1].submobjects[0].animate.set_color(self.COMPARE_COLOR),
                        run_time=0.4
                    )
                    self.wait(0.5)
                else:
                    operation_text.set_value(f"No swap: {array[j]} <= {array[j+1]}")
                    self.wait(1.0)

                # --- Revert Colors after Comparison ---
                self.play(
                    element_vgroups[j].submobjects[0].animate.set_color(self.DEFAULT_COLOR),
                    element_vgroups[j+1].submobjects[0].animate.set_color(self.DEFAULT_COLOR),
                    run_time=0.5
                )

            # --- End of Pass i ---
            # The largest element of the unsorted portion is now in its correct place.
            # Color the last element of the unsorted part as sorted.
            sorted_index = n - 1 - i
            self.play(
                element_vgroups[sorted_index].submobjects[0].animate.set_color(self.SORTED_COLOR),
                operation_text.animate.set_value(f"Element {array[sorted_index]} is now sorted (Pass {i+1} complete)."),
                run_time=0.5
            )
            self.wait(1.5)

            # Remove pointers at the end of each pass
            self.remove(j_pointer, j_plus_1_pointer)

        # --- Final State ---
        # Color remaining elements as sorted
        for i in range(n - 1):
            self.play(element_vgroups[i].submobjects[0].animate.set_color(self.SORTED_COLOR), run_time=0.2)

        operation_text.set_value("Array is completely sorted!")
        self.wait(2.5)

        # Fade out all elements
        self.play(
            FadeOut(element_vgroups),
            FadeOut(title),
            FadeOut(operation_text)
        )
        self.wait(1)
