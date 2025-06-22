
from manim import *

class MergeSortAnimation(Scene):
    def construct(self):
        # 1. Initial Array Setup
        arr = [8, 3, 1, 7, 0, 10, 2, 5]
        squares = VGroup(*[Square(side_length=1) for _ in arr])
        texts = VGroup(*[Text(str(x)) for x in arr])

        for i in range(len(arr)):
            texts[i].move_to(squares[i].get_center())

        elements = VGroup(*[VGroup(squares[i], texts[i]) for i in range(len(arr))])
        elements.arrange_submobjects(RIGHT)

        try:
            self.add(elements)
        except Exception as e:
            print(f'❌ Error: {e}')
        unsorted_label = Text("Unsorted Array").next_to(elements, UP)
        try:
            self.add(unsorted_label)
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.wait()
        except Exception as e:
            print(f'❌ Error: {e}')

        # 2. Divide Phase Visualization
        def divide(group, level):
            if len(group) <= 1:
                return group
            
            mid = len(group) // 2
            left_group = VGroup(*group[:mid])
            right_group = VGroup(*group[mid:])

            left_target = elements.copy().shift(DOWN * level + LEFT * (len(group)-1)/2)
            right_target = elements.copy().shift(DOWN * level + RIGHT * (len(group)-1)/2)
            left_target = VGroup(*left_target[:mid])
            right_target = VGroup(*right_target[mid:])
            
            try:
                self.play(
                group.animate.shift(DOWN * level),
                Transform(left_group, left_target),
                Transform(right_group, right_target)
                )
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.wait(0.5)
            except Exception as e:
                print(f'❌ Error: {e}')

            return (divide(left_group, level+1), divide(right_group, level+1))

        divide_label = Text("Divide").next_to(unsorted_label, DOWN)
        try:
            self.add(divide_label)
        except Exception as e:
            print(f'❌ Error: {e}')

        left, right = divide(elements, 2)

        try:
            self.wait()
        except Exception as e:
            print(f'❌ Error: {e}')

        try:
            self.remove(divide_label)
        except Exception as e:
            print(f'❌ Error: {e}')

        # 3. Merge Phase Visualization (Bottom-Up)

        def merge(left_group, right_group, target_y):

            i_pointer = Arrow(start=LEFT, end=ORIGIN, color=BLUE)
            j_pointer = Arrow(start=LEFT, end=ORIGIN, color=GREEN)
            k_pointer = Arrow(start=LEFT, end=ORIGIN, color=YELLOW)
            i_label = Text("i").next_to(i_pointer, LEFT)
            j_label = Text("j").next_to(j_pointer, LEFT)
            k_label = Text("k").next_to(k_pointer, LEFT)

            temp_array = VGroup(*[Square(side_length=1, fill_opacity=0.5) for _ in range(len(left_group) + len(right_group))])
            for i in range(len(temp_array)):
                temp_array[i].shift(DOWN*target_y)
            
            temp_label = Text("Temp Array").next_to(temp_array, UP)
            try:
                self.add(temp_label)
            except Exception as e:
                print(f'❌ Error: {e}')

            i = 0
            j = 0
            k = 0

            while i < len(left_group) and j < len(right_group):
                i_pointer.next_to(left_group[i], UP)
                j_pointer.next_to(right_group[j], UP)
                k_pointer.next_to(temp_array[k], UP)
                try:
                    self.play(
                    Create(i_pointer),
                    Create(j_pointer),
                    Create(k_pointer),
                    Create(i_label),
                    Create(j_label),
                    Create(k_label),
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(0.5)
                except Exception as e:
                    print(f'❌ Error: {e}')

                num1 = int(left_group[i][1].original_text)
                num2 = int(right_group[j][1].original_text)
                comparison = Text(f"{num1} vs {num2}").next_to(temp_label, DOWN)

                try:
                    self.add(comparison)
                except Exception as e:
                    print(f'❌ Error: {e}')

                if num1 <= num2:
                    try:
                        self.play(
                        Transform(left_group[i], temp_array[k]),
                        i_pointer.animate.shift(RIGHT),
                        k_pointer.animate.shift(RIGHT)
                        )
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    i += 1
                    k += 1
                else:
                    try:
                        self.play(
                        Transform(right_group[j], temp_array[k]),
                        j_pointer.animate.shift(RIGHT),
                        k_pointer.animate.shift(RIGHT)
                        )
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    j += 1
                    k += 1

                try:
                    self.remove(comparison)
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(0.5)
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.remove(i_pointer, j_pointer, k_pointer, i_label, j_label, k_label)
                except Exception as e:
                    print(f'❌ Error: {e}')
            
            while i < len(left_group):
                i_pointer.next_to(left_group[i], UP)
                k_pointer.next_to(temp_array[k], UP)

                try:
                    self.add(
                    i_pointer,
                    k_pointer,
                    i_label,
                    k_label,
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(
                    Transform(left_group[i], temp_array[k]),
                    i_pointer.animate.shift(RIGHT),
                    k_pointer.animate.shift(RIGHT)
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')

                i += 1
                k += 1

                try:
                    self.remove(i_pointer, k_pointer, i_label, k_label)
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(0.5)
                except Exception as e:
                    print(f'❌ Error: {e}')

            while j < len(right_group):
                j_pointer.next_to(right_group[j], UP)
                k_pointer.next_to(temp_array[k], UP)
                try:
                    self.add(
                    j_pointer,
                    k_pointer,
                    j_label,
                    k_label,
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(
                    Transform(right_group[j], temp_array[k]),
                    j_pointer.animate.shift(RIGHT),
                    k_pointer.animate.shift(RIGHT)
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')

                j += 1
                k += 1

                try:
                    self.remove(j_pointer, k_pointer, j_label, k_label)
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(0.5)
                except Exception as e:
                    print(f'❌ Error: {e}')
            for i in range(len(temp_array)):
                temp_array[i].submobjects.append(Text(temp_array[i].original_text))


            return temp_array
        try:
            self.wait()
        except Exception as e:
            print(f'❌ Error: {e}')

        merged = merge(left,right,0)


        #4. Final State
        sorted_label = Text("Sorted Array").next_to(unsorted_label, DOWN*5)
        try:
            self.add(sorted_label)
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.play(Transform(elements,merged))
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.wait(5)
        except Exception as e:
            print(f'❌ Error: {e}')
