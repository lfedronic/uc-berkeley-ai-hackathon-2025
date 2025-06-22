from manim import *
import random

class ProteinSynthesis(Scene):
    def construct(self):    
        # Create DNA molecule and RNA polymerase with Manim Circle(). Make them circular (with a radius of r=0.5). 
         self.dna = VGroup(*[Circle() for _ in range(2)])  
         
       dnalayer1,dnalayer2 =  self.dna[:-3],self.dna[-4:]    # get last three circles and remaining as DNA strand 
        rnpgroup = VGroup(*[Circle() for _ in range(8)])   # create RNA polymerase group with eight circulars (RNP, rough 
approximation of transcription initiation). Move them randomly. You can add more to this list if needed and randomize their positions 
as well
        self.add(dnalayer1 , dnalayer2  , rnpgroup )   # Add all three layers in the scene with dot() method for RNA Polymerase group 
     
        
      def transcription():     # Create an animation of Transcription Initiation   
          return { "Transition": self.dna, }              # DNA strand 1...5 (dnalayer2)   , Dot().next_to(self.rnpgroup[0], 
orient=random.choice([-PI/6,-PI/3])).shift((-.7,.4)) for r in range(-8)]
        ...                     # similar steps to elongation and end            ....  }   