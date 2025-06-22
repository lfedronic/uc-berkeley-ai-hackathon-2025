from manim import *

class DijkstraExplanation(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)

        title = Text("What is Dijkstra's Algorithm?", font_size=48)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        definition = Text("An algorithm for finding the shortest paths\nbetween nodes in a graph.", font_size=30)
        self.play(Write(definition))
        self.wait(2)
        self.play(FadeOut(definition))

        graph = Graph(
            [1, 2, 3, 4, 5],
            [(1, 2), (1, 3), (2, 4), (3, 4), (3, 5), (4, 5)],
            layout="spring",
            layout_scale=3
        )
        self.play(Create(graph))
        self.wait(1)

        example_text = Text("Example: Find the shortest path from 1 to 5", font_size=24)
        example_text.next_to(graph, DOWN)
        self.play(Write(example_text))
        self.wait(2)

        self.play(FadeOut(graph, example_text))

        conclusion = Text("Dijkstra's Algorithm efficiently solves\nthis type of problem!", font_size=30)
        self.play(Write(conclusion))
        self.wait(3)
        self.play(FadeOut(conclusion))