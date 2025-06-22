from manim import (
    Scene,
    VGroup,
    Text,
    Rectangle,
    WHITE,
    BLUE,
    YELLOW,
    RED,
    GREEN,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    ORIGIN,
    FadeIn,
    FadeOut,
    Transform,
    Indicate,
    config,
)
import numpy as np
from typing import List, Tuple, Any

# Configuration for Manim
#config.background_color = BLACK
config.frame_width = 16
config.frame_height = 9
config.pixel_width = 1920
config.pixel_height = 1080

# Constants
BAR_WIDTH = 0.8
BAR_HEIGHT_UNIT = 0.5
SPACING = BAR_WIDTH + 0.2
TEXT_SCALE = 0.6

# Pseudocode for Bubble Sort
BUBBLE_SORT_CODE = """
function bubbleSort(array):
    n = length of array
    for i from 0 to n-1:
        swapped = false
        for j from 0 to n-1-i:
            if array[j] > array[j+1]:
                swap array[j] and array[j+1]
                swapped = true
        if not swapped:
            break
"""

class BubbleSortAnimation(Scene):
    def construct(self):
        # --- 1. Initial Scene Setup ---
        title = Text("Bubble Sort Visualization", font_size=48, color=WHITE).to_edge(UP)
        self.play(FadeIn(title))
        self.wait(0.5)

        # Display Pseudocode
        code_display = Text(BUBBLE_SORT_CODE, font_size=24, color=WHITE).to_edge(LEFT).shift(RIGHT*2)
        self.play(FadeIn(code_display))
        self.wait(1)

        # Initial Array Data
        initial_array_values = [5, 2, 8, 1, 9, 4]
        n = len(initial_array_values)
        self.array_elements_mobjects: List[VGroup] = []

        # Calculate starting X position for centering the array
        total_width = n * BAR_WIDTH + (n - 1) * SPACING
        start_x = -total_width / 2

        # Create and position the initial array elements (bars and numbers)
        for i, value in enumerate(initial_array_values):
            rect = Rectangle(
                width=BAR_WIDTH,
                height=value * BAR_HEIGHT_UNIT,
                color=BLUE,
                fill_opacity=0.8,
                stroke_width=1.5,
                stroke_color=WHITE,
            )
            text = Text(str(value), font_size=24 * TEXT_SCALE, color=WHITE)
            text.move_to(rect.get_center())
            element_group = VGroup(rect, text)
            element_group.move_to([start_x + i * SPACING, 0, 0]) # Center the array
            self.array_elements_mobjects.append(element_group)

        self.play(
            *[FadeIn(mobject) for mobject in self.array_elements_mobjects]
        )
        self.wait(1)

        # Make pseudocode disappear after showing the array
        self.play(FadeOut(code_display))
        self.wait(0.5)

        # Simple indicator for unsorted section (replacing Brace)
        self.unsorted_brace = Rectangle(
            width=total_width,
            height=0.1,
            color=WHITE,
            stroke_width=2,
            fill_opacity=0.3
        )
        self.unsorted_brace.next_to(VGroup(*self.array_elements_mobjects), DOWN, buff=0.2)
        self.play(FadeIn(self.unsorted_brace))
        self.wait(0.5)

        # --- 2. Bubble Sort Algorithm Loop ---
        self.current_message_text = None
        self.active_message = None
        
        # Keep track of the actual array values to perform comparisons
        current_array_values = list(initial_array_values)

        for i in range(n):
            # --- 3. Outer Loop (Pass Animation) ---
            # self.play(Indicate(code_display.get_lines_by_index(3)), run_time=0.5) # Highlight outer loop - removed since Text doesn't have this method
            
            pass_text = Text(f"Pass {i+1}", font_size=30, color=WHITE).move_to(UP*2)
            if self.active_message:
                self.play(FadeOut(self.active_message, scale=0.5), FadeIn(pass_text))
            else:
                self.play(FadeIn(pass_text))
            self.active_message = pass_text
            self.wait(0.5)

            # Update indicator for the unsorted portion (simplified)
            new_width = (n-i) * SPACING
            new_brace = Rectangle(
                width=new_width,
                height=0.1,
                color=WHITE,
                stroke_width=2,
                fill_opacity=0.3
            )
            new_brace.next_to(VGroup(*self.array_elements_mobjects[:n-i]), DOWN, buff=0.2)
            self.play(Transform(self.unsorted_brace, new_brace))
            self.wait(0.5)

            swapped_in_pass = False

            # --- 4. Inner Loop (Comparison & Swap Animation) ---
            for j in range(n - 1 - i):
                # self.play(Indicate(code_display.get_lines_by_index(5)), run_time=0.5) # Highlight inner loop - removed

                mobject_j = self.array_elements_mobjects[j]
                mobject_j_plus_1 = self.array_elements_mobjects[j+1]

                rect_j = mobject_j[0]  # Rectangle is at index 0
                rect_j_plus_1 = mobject_j_plus_1[0]  # Rectangle is at index 0

                # self.play(Indicate(code_display.get_lines_by_index(6)), run_time=0.5) # Highlight comparison - removed

                # Highlight bars for comparison
                self.play(
                    rect_j.animate.set_color(YELLOW),
                    rect_j_plus_1.animate.set_color(YELLOW),
                    run_time=0.5
                )

                # Display comparison message
                compare_message = Text(f"Comparing {current_array_values[j]} and {current_array_values[j+1]}", font_size=24, color=WHITE)
                compare_message.move_to(DOWN*2)
                if self.active_message:
                    self.play(FadeOut(self.active_message, scale=0.5), FadeIn(compare_message))
                else:
                    self.play(FadeIn(compare_message))
                self.active_message = compare_message
                self.wait(1.0)

                # Check if swap is needed
                if current_array_values[j] > current_array_values[j+1]:
                    # self.play(Indicate(code_display.get_lines_by_index(7)), run_time=0.5) # Highlight swap - removed

                    # Change color to RED for swap
                    self.play(
                        rect_j.animate.set_color(RED),
                        rect_j_plus_1.animate.set_color(RED),
                        run_time=0.5
                    )

                    # Display swap message
                    swap_message = Text(f"Swapping {current_array_values[j]} and {current_array_values[j+1]}", font_size=24, color=WHITE)
                    swap_message.move_to(DOWN*2)
                    if self.active_message:
                        self.play(FadeOut(self.active_message, scale=0.5), FadeIn(swap_message))
                    else:
                        self.play(FadeIn(swap_message))
                    self.active_message = swap_message
                    self.wait(0.5)

                    # --- Complex Swap Animation ---
                    # Store original positions before animating
                    original_pos_j = mobject_j.get_center()
                    original_pos_j_plus_1 = mobject_j_plus_1.get_center()

                    # Move bars up slightly
                    self.play(
                        mobject_j.animate.shift(UP * 0.5),
                        mobject_j_plus_1.animate.shift(UP * 0.5),
                        run_time=0.4
                    )
                    # Move bars to new positions
                    self.play(
                        mobject_j.animate.move_to(original_pos_j_plus_1),
                        mobject_j_plus_1.animate.move_to(original_pos_j),
                        run_time=0.8
                    )
                    # Move bars back down
                    self.play(
                        mobject_j.animate.shift(DOWN * 0.5),
                        mobject_j_plus_1.animate.shift(DOWN * 0.5),
                        run_time=0.4
                    )

                    # Update the internal list of Mobjects
                    self.array_elements_mobjects[j], self.array_elements_mobjects[j+1] = \
                        self.array_elements_mobjects[j+1], self.array_elements_mobjects[j]

                    # Update the actual array values
                    current_array_values[j], current_array_values[j+1] = current_array_values[j+1], current_array_values[j]

                    swapped_in_pass = True
                else:
                    # Display no swap message
                    no_swap_message = Text(f"No swap needed", font_size=24, color=WHITE)
                    no_swap_message.move_to(DOWN*2)
                    if self.active_message:
                        self.play(FadeOut(self.active_message, scale=0.5), FadeIn(no_swap_message))
                    else:
                        self.play(FadeIn(no_swap_message))
                    self.active_message = no_swap_message
                    self.wait(1.0)

                # Return bars to default color after comparison/swap
                self.play(
                    rect_j.animate.set_color(BLUE),
                    rect_j_plus_1.animate.set_color(BLUE),
                    run_time=0.5
                )
                self.wait(0.5) # Small pause between comparisons

            # --- 5. End of Pass Animation ---
            # Color the last element of the current unsorted portion as sorted
            sorted_mobject = self.array_elements_mobjects[n - 1 - i]
            sorted_rect = sorted_mobject[0]  # Rectangle is at index 0
            self.play(sorted_rect.animate.set_color(GREEN))

            # Check for optimization: if no swaps happened in this pass
            # self.play(Indicate(code_display.get_lines_by_index(8)), run_time=0.5) # Highlight optimization check - removed
            if not swapped_in_pass:
                # Display sorted message
                sorted_message = Text("Array is Sorted!", font_size=36, color=GREEN)
                sorted_message.move_to(ORIGIN)
                self.play(FadeOut(self.active_message, scale=0.5), FadeIn(sorted_message))
                self.wait(1.0)
                # Color remaining bars green
                for k in range(n - i): # Color elements not yet colored green
                    mobject = self.array_elements_mobjects[k]
                    rect = mobject[0]  # Rectangle is at index 0
                    if rect.get_color() != GREEN:
                        self.play(rect.animate.set_color(GREEN), run_time=0.2)
                self.wait(1.0)
                break # Exit outer loop early

            self.wait(1.0) # Pause after each pass before the next

        # --- 6. Final Scene ---
        self.play(FadeOut(self.active_message, scale=0.5)) # Fade out final message
        final_message = Text("Sorting Complete!", font_size=48, color=GREEN).to_edge(DOWN)
        self.play(FadeIn(final_message))
        self.wait(3.0)

