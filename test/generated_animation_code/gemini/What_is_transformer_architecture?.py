from manim import *

from manim import Scene, MovingCameraScene, Rectangle, Text, VGroup
from manim import UP, DOWN, LEFT, RIGHT, ORIGIN, WHITE, BLACK, RED, GREEN, BLUE, YELLOW, PURPLE, ORANGE
from manim import Transform, FadeIn, FadeOut, Indicate

class BubbleSortAnimation(MovingCameraScene):
    def construct(self):
        # 1. Setup
        array = [5, 1, 4, 2, 8]
        rect_width = 1.0
        rect_height_scale = 0.5
        spacing = 0.1
        Y_BASE = -1.0 # Y-coordinate for the bottom of the rectangles

        # Title
        title = Text("Bubble Sort Visualization", font_size=48).to_edge(UP)
        self.play(FadeIn(title))
        self.wait(1)

        # Create initial rectangles and texts
        mobjects = [] # List to hold VGroups of (rectangle, text)

        # Calculate total width to center the array
        total_width = len(array) * rect_width + (len(array) - 1) * spacing
        start_x = -total_width / 2 + rect_width / 2

        for i, val in enumerate(array):
            rect = Rectangle(
                width=rect_width,
                height=val * rect_height_scale,
                color=BLUE,
                fill_opacity=0.7
            )
            text = Text(str(val), font_size=36, color=WHITE)
            element_group = VGroup(rect, text)

            # Position the element group
            x_pos = start_x + i * (rect_width + spacing)
            y_pos = Y_BASE + (val * rect_height_scale) / 2
            element_group.move_to(x_pos * RIGHT + y_pos * UP)
            text.move_to(rect.get_center()) # Ensure text is centered on its rectangle

            mobjects.append(element_group)

        array_mobject_initial = VGroup(*mobjects) # For initial fade-in and final fade-out
        self.play(FadeIn(array_mobject_initial))
        self.wait(1)

        # Labels for current action
        action_label = Text("", font_size=30).next_to(array_mobject_initial, DOWN, buff=1.0)
        self.add(action_label)

        # 2. Bubble Sort Logic and Animation
        n = len(array)
        for i in range(n - 1): # Passes
            swapped_in_pass = False
            pass_label = Text(f"Pass {i + 1}", font_size=36, color=YELLOW).next_to(title, DOWN)
            self.play(FadeIn(pass_label))
            self.wait(0.5)

            for j in range(n - 1 - i): # Comparisons in current pass
                element1_group = mobjects[j]
                element2_group = mobjects[j+1]

                # Store original colors to revert later
                original_color1 = element1_group[0].get_color()
                original_color2 = element2_group[0].get_color()

                # Update action label for comparison
                action_label.become(Text(f"Comparing {array[j]} and {array[j+1]}", font_size=30).next_to(array_mobject_initial, DOWN, buff=1.0))
                self.play(
                    Indicate(element1_group), # Pulse effect
                    Indicate(element2_group), # Pulse effect
                    element1_group[0].animate.set_color(YELLOW), # Change color to highlight
                    element2_group[0].animate.set_color(YELLOW), # Change color to highlight
                    FadeIn(action_label)
                )
                self.wait(0.5)

                if array[j] > array[j+1]:
                    swapped_in_pass = True
                    # Update action label for swap
                    action_label.become(Text(f"Swapping {array[j]} and {array[j+1]}", font_size=30).next_to(array_mobject_initial, DOWN, buff=1.0))

                    # Change color to RED for swap indication
                    self.play(
                        element1_group[0].animate.set_color(RED),
                        element2_group[0].animate.set_color(RED),
                        FadeIn(action_label)
                    )
                    self.wait(0.5)

                    # Perform the swap in the underlying array
                    array[j], array[j+1] = array[j+1], array[j]

                    # Animate the swap of mobjects
                    # Get current positions
                    pos1 = element1_group.get_center()
                    pos2 = element2_group.get_center()

                    # Create target mobjects at the swapped positions
                    target_element1_group = element1_group.copy().move_to(pos2)
                    target_element2_group = element2_group.copy().move_to(pos1)

                    # Perform the Transform animation
                    self.play(
                        Transform(element1_group, target_element1_group),
                        Transform(element2_group, target_element2_group)
                    )
                    self.wait(0.5)

                    # Update the mobjects list to reflect the new order
                    # This is crucial for subsequent comparisons to use the correct mobjects
                    mobjects[j], mobjects[j+1] = mobjects[j+1], mobjects[j]

                else:
                    # No swap needed
                    action_label.become(Text(f"No swap needed for {array[j]} and {array[j+1]}", font_size=30).next_to(array_mobject_initial, DOWN, buff=1.0))
                    self.play(FadeIn(action_label))
                    self.wait(0.5)

                # Revert colors to original (or BLUE if not sorted yet)
                self.play(
                    element1_group[0].animate.set_color(original_color1),
                    element2_group[0].animate.set_color(original_color2)
                )
                self.wait(0.2)

            # After each pass, the largest unsorted element is in its correct place
            # Mark the last element of the unsorted part as sorted (GREEN)
            sorted_element_group = mobjects[n - 1 - i]
            self.play(sorted_element_group[0].animate.set_color(GREEN))
            self.wait(0.5)

            self.play(FadeOut(pass_label))
            if not swapped_in_pass:
                # Optimization: if no swaps occurred in a pass, the array is sorted
                action_label.become(Text("Array is sorted!", font_size=30, color=GREEN).next_to(array_mobject_initial, DOWN, buff=1.0))
                self.play(FadeIn(action_label))
                self.wait(1)
                break # Exit outer loop

        # Mark the first element as sorted if the loop finished without breaking
        # (This handles the case where the loop completes and the first element is the last one to be marked)
        if not all(m[0].get_color() == GREEN for m in mobjects):
            self.play(mobjects[0][0].animate.set_color(GREEN))
            self.wait(0.5)

        # Final state: all elements are green
        action_label.become(Text("Sorting Complete!", font_size=36, color=GREEN).next_to(array_mobject_initial, DOWN, buff=1.0))
        self.play(FadeIn(action_label))
        self.wait(2)

        # Fade out all mobjects
        self.play(FadeOut(VGroup(*mobjects)), FadeOut(title), FadeOut(action_label))
        self.wait(1)