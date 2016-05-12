/**
 * The $N Multistroke Recognizer (JavaScript version)
 *
 *	Lisa Anthony, Ph.D.
 *      UMBC
 *      Information Systems Department
 *      1000 Hilltop Circle
 *      Baltimore, MD 21250
 *      lanthony@umbc.edu
 *
 *	Jacob O. Wobbrock, Ph.D.
 * 	The Information School
 *	University of Washington
 *	Seattle, WA 98195-2840
 *	wobbrock@uw.edu
 *
 * The academic publications for the $N recognizer, and what should be
 * used to cite it, are:
 *
 *	Anthony, L. and Wobbrock, J.O. (2010). A lightweight multistroke
 *	  recognizer for user interface prototypes. Proceedings of Graphics
 *	  Interface (GI '10). Ottawa, Ontario (May 31-June 2, 2010). Toronto,
 *	  Ontario: Canadian Information Processing Society, pp. 245-252.
 *
 *	Anthony, L. and Wobbrock, J.O. (2012). $N-Protractor: A fast and
 *	  accurate multistroke recognizer. Proceedings of Graphics Interface
 *	  (GI '12). Toronto, Ontario (May 28-30, 2012). Toronto, Ontario:
 *	  Canadian Information Processing Society, pp. 117-120.
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock and Lisa Anthony:
 *
 *	Li, Y. (2010). Protractor: A fast and accurate gesture
 *	  recognizer. Proceedings of the ACM Conference on Human
 *	  Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *	  (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2011, Jacob O. Wobbrock and Lisa Anthony.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of UMBC nor the University of Washington,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Lisa Anthony OR Jacob O. Wobbrock
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
**/
//
// Point class
//
function Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function Unistroke(name, useBoundedRotationInvariance, points) // constructor
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleDimTo(this.Points, SquareSize, OneDThreshold);
	if (useBoundedRotationInvariance)
		this.Points = RotateBy(this.Points, +radians); // restore
	this.Points = TranslateTo(this.Points, Origin);
	this.StartUnitVector = CalcStartUnitVector(this.Points, StartAngleIndex);
	this.Vector = Vectorize(this.Points, useBoundedRotationInvariance); // for Protractor
}
//
// Multistroke class: a container for unistrokes
//
function Multistroke(name, useBoundedRotationInvariance, strokes) // constructor
{
	this.Name = name;
	this.NumStrokes = strokes.length; // number of individual strokes

	var order = new Array(strokes.length); // array of integer indices
	for (var i = 0; i < strokes.length; i++)
		order[i] = i; // initialize
	var orders = new Array(); // array of integer arrays
	HeapPermute(strokes.length, order, /*out*/ orders);

	var unistrokes = MakeUnistrokes(strokes, orders); // returns array of point arrays
	this.Unistrokes = new Array(unistrokes.length); // unistrokes for this multistroke
	for (var j = 0; j < unistrokes.length; j++)
		this.Unistrokes[j] = new Unistroke(name, useBoundedRotationInvariance, unistrokes[j]);
}
//
// Result class
//
function Result(name, score) // constructor
{
	this.Name = name;
	this.Score = score;
}
//
// NDollarRecognizer class constants
//
var NumMultistrokes = 1; // TODO: --> is it really neccessary to give the exact number of multistrokes????
var NumPoints = 96;
var SquareSize = 250.0;
var OneDThreshold = 0.25; // customize to desired gesture set (usually 0.20 - 0.35)
var Origin = new Point(0,0);
var Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
var HalfDiagonal = 0.5 * Diagonal;
var AngleRange = Deg2Rad(45.0);
var AnglePrecision = Deg2Rad(2.0);
var Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
var StartAngleIndex = (NumPoints / 8); // eighth of gesture length
var AngleSimilarityThreshold = Deg2Rad(30.0);
//
// NDollarRecognizer class
//
function NDollarRecognizer(useBoundedRotationInvariance) // constructor
{
	//
	// one predefined multistroke for each multistroke type
	//
	this.Multistrokes = new Array(NumMultistrokes);
	// this.Multistrokes[0] = new Multistroke("T", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(30,7),new Point(103,7)),
	// 	new Array(new Point(66,7),new Point(66,87))
	// ));
	// this.Multistrokes[1] = new Multistroke("N", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(177,92),new Point(177,2)),
	// 	new Array(new Point(182,1),new Point(246,95)),
	// 	new Array(new Point(247,87),new Point(247,1))
	// ));
	// this.Multistrokes[2] = new Multistroke("D", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(345,9),new Point(345,87)),
	// 	new Array(new Point(351,8),new Point(363,8),new Point(372,9),new Point(380,11),new Point(386,14),new Point(391,17),new Point(394,22),new Point(397,28),new Point(399,34),new Point(400,42),new Point(400,50),new Point(400,56),new Point(399,61),new Point(397,66),new Point(394,70),new Point(391,74),new Point(386,78),new Point(382,81),new Point(377,83),new Point(372,85),new Point(367,87),new Point(360,87),new Point(355,88),new Point(349,87))
	// ));
	// this.Multistrokes[3] = new Multistroke("P", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(507,8),new Point(507,87)),
	// 	new Array(new Point(513,7),new Point(528,7),new Point(537,8),new Point(544,10),new Point(550,12),new Point(555,15),new Point(558,18),new Point(560,22),new Point(561,27),new Point(562,33),new Point(561,37),new Point(559,42),new Point(556,45),new Point(550,48),new Point(544,51),new Point(538,53),new Point(532,54),new Point(525,55),new Point(519,55),new Point(513,55),new Point(510,55))
	// ));
	this.Multistrokes[0] = new Multistroke("X", useBoundedRotationInvariance, new Array(
		new Array(new Point(30,146),new Point(106,222)),
		new Array(new Point(30,225),new Point(106,146))
	));
	this.Multistrokes[1] = new Multistroke("Rectangle", useBoundedRotationInvariance, [
		  [
		    {
		      "X": 148,
		      "Y": 130
		    },
		    {
		      "X": 147,
		      "Y": 152
		    },
		    {
		      "X": 147,
		      "Y": 257
		    },
		    {
		      "X": 147,
		      "Y": 258
		    },
		    {
		      "X": 147,
		      "Y": 259
		    },
		    {
		      "X": 147,
		      "Y": 259
		    },
		    {
		      "X": 147,
		      "Y": 261
		    },
		    {
		      "X": 147,
		      "Y": 261
		    },
		    {
		      "X": 146,
		      "Y": 261
		    },
		    {
		      "X": 146,
		      "Y": 262
		    },
		    {
		      "X": 145,
		      "Y": 263
		    },
		    {
		      "X": 145,
		      "Y": 263
		    },
		    {
		      "X": 145,
		      "Y": 263
		    },
		    {
		      "X": 144,
		      "Y": 263
		    },
		    {
		      "X": 144,
		      "Y": 264
		    },
		    {
		      "X": 143,
		      "Y": 264
		    },
		    {
		      "X": 143,
		      "Y": 265
		    },
		    {
		      "X": 142,
		      "Y": 265
		    },
		    {
		      "X": 141,
		      "Y": 265
		    },
		    {
		      "X": 141,
		      "Y": 264
		    },
		    {
		      "X": 141,
		      "Y": 264
		    },
		    {
		      "X": 141,
		      "Y": 263
		    },
		    {
		      "X": 141,
		      "Y": 264
		    },
		    {
		      "X": 141,
		      "Y": 265
		    },
		    {
		      "X": 141,
		      "Y": 265
		    },
		    {
		      "X": 141,
		      "Y": 266
		    },
		    {
		      "X": 141,
		      "Y": 267
		    },
		    {
		      "X": 141,
		      "Y": 267
		    },
		    {
		      "X": 141,
		      "Y": 268
		    },
		    {
		      "X": 141,
		      "Y": 269
		    },
		    {
		      "X": 142,
		      "Y": 269
		    },
		    {
		      "X": 142,
		      "Y": 269
		    },
		    {
		      "X": 142,
		      "Y": 268
		    },
		    {
		      "X": 143,
		      "Y": 268
		    },
		    {
		      "X": 143,
		      "Y": 267
		    },
		    {
		      "X": 143,
		      "Y": 267
		    },
		    {
		      "X": 144,
		      "Y": 266
		    },
		    {
		      "X": 145,
		      "Y": 265
		    },
		    {
		      "X": 145,
		      "Y": 265
		    },
		    {
		      "X": 146,
		      "Y": 264
		    },
		    {
		      "X": 147,
		      "Y": 264
		    },
		    {
		      "X": 147,
		      "Y": 263
		    },
		    {
		      "X": 149,
		      "Y": 263
		    },
		    {
		      "X": 150,
		      "Y": 261
		    },
		    {
		      "X": 151,
		      "Y": 261
		    },
		    {
		      "X": 153,
		      "Y": 260
		    },
		    {
		      "X": 154,
		      "Y": 259
		    },
		    {
		      "X": 156,
		      "Y": 259
		    },
		    {
		      "X": 157,
		      "Y": 258
		    },
		    {
		      "X": 160,
		      "Y": 257
		    },
		    {
		      "X": 162,
		      "Y": 256
		    },
		    {
		      "X": 164,
		      "Y": 255
		    },
		    {
		      "X": 166,
		      "Y": 255
		    },
		    {
		      "X": 169,
		      "Y": 254
		    },
		    {
		      "X": 171,
		      "Y": 253
		    },
		    {
		      "X": 174,
		      "Y": 253
		    },
		    {
		      "X": 177,
		      "Y": 252
		    },
		    {
		      "X": 180,
		      "Y": 251
		    },
		    {
		      "X": 183,
		      "Y": 251
		    },
		    {
		      "X": 186,
		      "Y": 250
		    },
		    {
		      "X": 189,
		      "Y": 249
		    },
		    {
		      "X": 192,
		      "Y": 249
		    },
		    {
		      "X": 195,
		      "Y": 248
		    },
		    {
		      "X": 199,
		      "Y": 248
		    },
		    {
		      "X": 202,
		      "Y": 248
		    },
		    {
		      "X": 205,
		      "Y": 247
		    },
		    {
		      "X": 208,
		      "Y": 247
		    },
		    {
		      "X": 211,
		      "Y": 247
		    },
		    {
		      "X": 215,
		      "Y": 247
		    },
		    {
		      "X": 218,
		      "Y": 247
		    },
		    {
		      "X": 221,
		      "Y": 247
		    },
		    {
		      "X": 224,
		      "Y": 247
		    },
		    {
		      "X": 227,
		      "Y": 247
		    },
		    {
		      "X": 230,
		      "Y": 247
		    },
		    {
		      "X": 233,
		      "Y": 247
		    },
		    {
		      "X": 235,
		      "Y": 248
		    },
		    {
		      "X": 238,
		      "Y": 248
		    },
		    {
		      "X": 241,
		      "Y": 248
		    },
		    {
		      "X": 243,
		      "Y": 249
		    },
		    {
		      "X": 245,
		      "Y": 249
		    },
		    {
		      "X": 248,
		      "Y": 249
		    },
		    {
		      "X": 250,
		      "Y": 250
		    },
		    {
		      "X": 252,
		      "Y": 250
		    },
		    {
		      "X": 254,
		      "Y": 251
		    },
		    {
		      "X": 256,
		      "Y": 251
		    },
		    {
		      "X": 257,
		      "Y": 251
		    },
		    {
		      "X": 259,
		      "Y": 251
		    },
		    {
		      "X": 260,
		      "Y": 252
		    },
		    {
		      "X": 261,
		      "Y": 252
		    },
		    {
		      "X": 262,
		      "Y": 252
		    },
		    {
		      "X": 263,
		      "Y": 253
		    },
		    {
		      "X": 263,
		      "Y": 253
		    },
		    {
		      "X": 264,
		      "Y": 253
		    },
		    {
		      "X": 265,
		      "Y": 253
		    },
		    {
		      "X": 265,
		      "Y": 253
		    },
		    {
		      "X": 266,
		      "Y": 253
		    },
		    {
		      "X": 267,
		      "Y": 253
		    },
		    {
		      "X": 267,
		      "Y": 253
		    },
		    {
		      "X": 268,
		      "Y": 253
		    },
		    {
		      "X": 268,
		      "Y": 252
		    },
		    {
		      "X": 267,
		      "Y": 252
		    },
		    {
		      "X": 267,
		      "Y": 251
		    },
		    {
		      "X": 267,
		      "Y": 251
		    },
		    {
		      "X": 267,
		      "Y": 251
		    },
		    {
		      "X": 267,
		      "Y": 250
		    },
		    {
		      "X": 266,
		      "Y": 250
		    },
		    {
		      "X": 266,
		      "Y": 249
		    },
		    {
		      "X": 265,
		      "Y": 249
		    },
		    {
		      "X": 265,
		      "Y": 249
		    },
		    {
		      "X": 265,
		      "Y": 248
		    },
		    {
		      "X": 266,
		      "Y": 247
		    },
		    {
		      "X": 266,
		      "Y": 247
		    },
		    {
		      "X": 267,
		      "Y": 246
		    },
		    {
		      "X": 267,
		      "Y": 245
		    },
		    {
		      "X": 267,
		      "Y": 245
		    },
		    {
		      "X": 267,
		      "Y": 243
		    },
		    {
		      "X": 267,
		      "Y": 242
		    },
		    {
		      "X": 267,
		      "Y": 241
		    },
		    {
		      "X": 267,
		      "Y": 239
		    },
		    {
		      "X": 267,
		      "Y": 237
		    },
		    {
		      "X": 267,
		      "Y": 234
		    },
		    {
		      "X": 267,
		      "Y": 232
		    },
		    {
		      "X": 267,
		      "Y": 229
		    },
		    {
		      "X": 267,
		      "Y": 227
		    },
		    {
		      "X": 267,
		      "Y": 224
		    },
		    {
		      "X": 267,
		      "Y": 221
		    },
		    {
		      "X": 267,
		      "Y": 217
		    },
		    {
		      "X": 267,
		      "Y": 214
		    },
		    {
		      "X": 267,
		      "Y": 211
		    },
		    {
		      "X": 267,
		      "Y": 207
		    },
		    {
		      "X": 267,
		      "Y": 203
		    },
		    {
		      "X": 268,
		      "Y": 199
		    },
		    {
		      "X": 268,
		      "Y": 195
		    },
		    {
		      "X": 269,
		      "Y": 191
		    },
		    {
		      "X": 269,
		      "Y": 188
		    },
		    {
		      "X": 269,
		      "Y": 185
		    },
		    {
		      "X": 269,
		      "Y": 181
		    },
		    {
		      "X": 269,
		      "Y": 178
		    },
		    {
		      "X": 269,
		      "Y": 175
		    },
		    {
		      "X": 269,
		      "Y": 172
		    },
		    {
		      "X": 269,
		      "Y": 169
		    },
		    {
		      "X": 269,
		      "Y": 167
		    },
		    {
		      "X": 269,
		      "Y": 164
		    },
		    {
		      "X": 269,
		      "Y": 161
		    },
		    {
		      "X": 269,
		      "Y": 159
		    },
		    {
		      "X": 269,
		      "Y": 157
		    },
		    {
		      "X": 269,
		      "Y": 155
		    },
		    {
		      "X": 270,
		      "Y": 154
		    },
		    {
		      "X": 270,
		      "Y": 153
		    },
		    {
		      "X": 270,
		      "Y": 151
		    },
		    {
		      "X": 270,
		      "Y": 150
		    },
		    {
		      "X": 270,
		      "Y": 149
		    },
		    {
		      "X": 271,
		      "Y": 148
		    },
		    {
		      "X": 271,
		      "Y": 147
		    },
		    {
		      "X": 271,
		      "Y": 147
		    },
		    {
		      "X": 271,
		      "Y": 146
		    },
		    {
		      "X": 271,
		      "Y": 146
		    },
		    {
		      "X": 271,
		      "Y": 145
		    },
		    {
		      "X": 272,
		      "Y": 145
		    },
		    {
		      "X": 272,
		      "Y": 145
		    },
		    {
		      "X": 273,
		      "Y": 145
		    },
		    {
		      "X": 273,
		      "Y": 144
		    },
		    {
		      "X": 273,
		      "Y": 144
		    },
		    {
		      "X": 274,
		      "Y": 143
		    },
		    {
		      "X": 275,
		      "Y": 143
		    },
		    {
		      "X": 275,
		      "Y": 143
		    },
		    {
		      "X": 276,
		      "Y": 143
		    },
		    {
		      "X": 277,
		      "Y": 142
		    },
		    {
		      "X": 277,
		      "Y": 141
		    },
		    {
		      "X": 277,
		      "Y": 141
		    },
		    {
		      "X": 277,
		      "Y": 140
		    },
		    {
		      "X": 278,
		      "Y": 139
		    },
		    {
		      "X": 278,
		      "Y": 138
		    },
		    {
		      "X": 278,
		      "Y": 137
		    },
		    {
		      "X": 279,
		      "Y": 137
		    },
		    {
		      "X": 279,
		      "Y": 135
		    },
		    {
		      "X": 279,
		      "Y": 135
		    },
		    {
		      "X": 279,
		      "Y": 133
		    },
		    {
		      "X": 279,
		      "Y": 133
		    },
		    {
		      "X": 279,
		      "Y": 131
		    },
		    {
		      "X": 279,
		      "Y": 131
		    },
		    {
		      "X": 279,
		      "Y": 130
		    },
		    {
		      "X": 279,
		      "Y": 129
		    },
		    {
		      "X": 279,
		      "Y": 128
		    },
		    {
		      "X": 279,
		      "Y": 127
		    },
		    {
		      "X": 279,
		      "Y": 126
		    },
		    {
		      "X": 279,
		      "Y": 125
		    },
		    {
		      "X": 278,
		      "Y": 124
		    },
		    {
		      "X": 278,
		      "Y": 123
		    },
		    {
		      "X": 277,
		      "Y": 123
		    },
		    {
		      "X": 277,
		      "Y": 122
		    },
		    {
		      "X": 277,
		      "Y": 121
		    },
		    {
		      "X": 276,
		      "Y": 121
		    },
		    {
		      "X": 276,
		      "Y": 121
		    },
		    {
		      "X": 275,
		      "Y": 120
		    },
		    {
		      "X": 275,
		      "Y": 120
		    },
		    {
		      "X": 273,
		      "Y": 119
		    },
		    {
		      "X": 271,
		      "Y": 119
		    },
		    {
		      "X": 271,
		      "Y": 119
		    },
		    {
		      "X": 269,
		      "Y": 119
		    },
		    {
		      "X": 268,
		      "Y": 120
		    },
		    {
		      "X": 267,
		      "Y": 120
		    },
		    {
		      "X": 266,
		      "Y": 121
		    },
		    {
		      "X": 265,
		      "Y": 121
		    },
		    {
		      "X": 263,
		      "Y": 121
		    },
		    {
		      "X": 261,
		      "Y": 121
		    },
		    {
		      "X": 259,
		      "Y": 122
		    },
		    {
		      "X": 257,
		      "Y": 123
		    },
		    {
		      "X": 255,
		      "Y": 124
		    },
		    {
		      "X": 253,
		      "Y": 125
		    },
		    {
		      "X": 250,
		      "Y": 125
		    },
		    {
		      "X": 248,
		      "Y": 126
		    },
		    {
		      "X": 245,
		      "Y": 127
		    },
		    {
		      "X": 243,
		      "Y": 127
		    },
		    {
		      "X": 239,
		      "Y": 127
		    },
		    {
		      "X": 237,
		      "Y": 128
		    },
		    {
		      "X": 233,
		      "Y": 129
		    },
		    {
		      "X": 230,
		      "Y": 129
		    },
		    {
		      "X": 227,
		      "Y": 130
		    },
		    {
		      "X": 224,
		      "Y": 131
		    },
		    {
		      "X": 221,
		      "Y": 131
		    },
		    {
		      "X": 218,
		      "Y": 132
		    },
		    {
		      "X": 215,
		      "Y": 132
		    },
		    {
		      "X": 211,
		      "Y": 133
		    },
		    {
		      "X": 208,
		      "Y": 133
		    },
		    {
		      "X": 205,
		      "Y": 133
		    },
		    {
		      "X": 202,
		      "Y": 133
		    },
		    {
		      "X": 199,
		      "Y": 133
		    },
		    {
		      "X": 196,
		      "Y": 133
		    },
		    {
		      "X": 193,
		      "Y": 133
		    },
		    {
		      "X": 189,
		      "Y": 133
		    },
		    {
		      "X": 187,
		      "Y": 133
		    },
		    {
		      "X": 184,
		      "Y": 133
		    },
		    {
		      "X": 181,
		      "Y": 133
		    },
		    {
		      "X": 178,
		      "Y": 132
		    },
		    {
		      "X": 176,
		      "Y": 132
		    },
		    {
		      "X": 173,
		      "Y": 131
		    },
		    {
		      "X": 171,
		      "Y": 131
		    },
		    {
		      "X": 168,
		      "Y": 130
		    },
		    {
		      "X": 165,
		      "Y": 129
		    },
		    {
		      "X": 163,
		      "Y": 129
		    },
		    {
		      "X": 161,
		      "Y": 129
		    },
		    {
		      "X": 159,
		      "Y": 128
		    },
		    {
		      "X": 157,
		      "Y": 127
		    },
		    {
		      "X": 155,
		      "Y": 127
		    },
		    {
		      "X": 153,
		      "Y": 126
		    },
		    {
		      "X": 152,
		      "Y": 125
		    },
		    {
		      "X": 151,
		      "Y": 125
		    },
		    {
		      "X": 149,
		      "Y": 124
		    },
		    {
		      "X": 149,
		      "Y": 123
		    },
		    {
		      "X": 147,
		      "Y": 123
		    },
		    {
		      "X": 147,
		      "Y": 123
		    },
		    {
		      "X": 146,
		      "Y": 122
		    },
		    {
		      "X": 145,
		      "Y": 121
		    },
		    {
		      "X": 145,
		      "Y": 121
		    },
		    {
		      "X": 146,
		      "Y": 120
		    }
		  ]
		]
	);
	this.Multistrokes[2] = new Multistroke("Arrow", useBoundedRotationInvariance, [
  [
    {
      "X": 95,
      "Y": 301
    },
    {
      "X": 98,
      "Y": 291
    },
    {
      "X": 99,
      "Y": 289
    },
    {
      "X": 100,
      "Y": 287
    },
    {
      "X": 102,
      "Y": 285
    },
    {
      "X": 103,
      "Y": 282
    },
    {
      "X": 105,
      "Y": 279
    },
    {
      "X": 108,
      "Y": 277
    },
    {
      "X": 111,
      "Y": 273
    },
    {
      "X": 113,
      "Y": 270
    },
    {
      "X": 116,
      "Y": 266
    },
    {
      "X": 119,
      "Y": 262
    },
    {
      "X": 122,
      "Y": 259
    },
    {
      "X": 126,
      "Y": 254
    },
    {
      "X": 129,
      "Y": 249
    },
    {
      "X": 133,
      "Y": 245
    },
    {
      "X": 137,
      "Y": 239
    },
    {
      "X": 141,
      "Y": 235
    },
    {
      "X": 146,
      "Y": 229
    },
    {
      "X": 151,
      "Y": 225
    },
    {
      "X": 155,
      "Y": 220
    },
    {
      "X": 159,
      "Y": 215
    },
    {
      "X": 163,
      "Y": 210
    },
    {
      "X": 168,
      "Y": 205
    },
    {
      "X": 173,
      "Y": 200
    },
    {
      "X": 177,
      "Y": 195
    },
    {
      "X": 182,
      "Y": 191
    },
    {
      "X": 186,
      "Y": 186
    },
    {
      "X": 191,
      "Y": 181
    },
    {
      "X": 195,
      "Y": 177
    },
    {
      "X": 199,
      "Y": 173
    },
    {
      "X": 203,
      "Y": 169
    },
    {
      "X": 207,
      "Y": 165
    },
    {
      "X": 210,
      "Y": 161
    },
    {
      "X": 214,
      "Y": 157
    },
    {
      "X": 217,
      "Y": 153
    },
    {
      "X": 221,
      "Y": 151
    },
    {
      "X": 224,
      "Y": 147
    },
    {
      "X": 227,
      "Y": 145
    },
    {
      "X": 230,
      "Y": 142
    },
    {
      "X": 232,
      "Y": 139
    },
    {
      "X": 234,
      "Y": 137
    },
    {
      "X": 236,
      "Y": 135
    },
    {
      "X": 238,
      "Y": 133
    },
    {
      "X": 239,
      "Y": 131
    }
  ],
  [
    {
      "X": 137,
      "Y": 159
    },
    {
      "X": 140,
      "Y": 159
    },
    {
      "X": 141,
      "Y": 159
    },
    {
      "X": 143,
      "Y": 158
    },
    {
      "X": 145,
      "Y": 157
    },
    {
      "X": 147,
      "Y": 157
    },
    {
      "X": 149,
      "Y": 156
    },
    {
      "X": 152,
      "Y": 155
    },
    {
      "X": 155,
      "Y": 154
    },
    {
      "X": 158,
      "Y": 153
    },
    {
      "X": 161,
      "Y": 151
    },
    {
      "X": 165,
      "Y": 150
    },
    {
      "X": 169,
      "Y": 149
    },
    {
      "X": 173,
      "Y": 147
    },
    {
      "X": 177,
      "Y": 145
    },
    {
      "X": 181,
      "Y": 143
    },
    {
      "X": 186,
      "Y": 141
    },
    {
      "X": 190,
      "Y": 139
    },
    {
      "X": 195,
      "Y": 137
    },
    {
      "X": 199,
      "Y": 135
    },
    {
      "X": 204,
      "Y": 133
    },
    {
      "X": 209,
      "Y": 131
    },
    {
      "X": 213,
      "Y": 129
    },
    {
      "X": 217,
      "Y": 127
    },
    {
      "X": 221,
      "Y": 126
    },
    {
      "X": 225,
      "Y": 125
    },
    {
      "X": 228,
      "Y": 124
    },
    {
      "X": 231,
      "Y": 123
    },
    {
      "X": 233,
      "Y": 122
    },
    {
      "X": 235,
      "Y": 121
    },
    {
      "X": 237,
      "Y": 121
    },
    {
      "X": 239,
      "Y": 121
    },
    {
      "X": 241,
      "Y": 121
    },
    {
      "X": 242,
      "Y": 121
    },
    {
      "X": 243,
      "Y": 121
    },
    {
      "X": 245,
      "Y": 121
    },
    {
      "X": 245,
      "Y": 121
    },
    {
      "X": 245,
      "Y": 121
    },
    {
      "X": 246,
      "Y": 122
    },
    {
      "X": 246,
      "Y": 123
    },
    {
      "X": 246,
      "Y": 124
    },
    {
      "X": 245,
      "Y": 125
    },
    {
      "X": 245,
      "Y": 127
    },
    {
      "X": 245,
      "Y": 129
    },
    {
      "X": 244,
      "Y": 132
    },
    {
      "X": 243,
      "Y": 135
    },
    {
      "X": 242,
      "Y": 139
    },
    {
      "X": 241,
      "Y": 143
    },
    {
      "X": 241,
      "Y": 147
    },
    {
      "X": 239,
      "Y": 151
    },
    {
      "X": 238,
      "Y": 156
    },
    {
      "X": 237,
      "Y": 161
    },
    {
      "X": 235,
      "Y": 166
    },
    {
      "X": 233,
      "Y": 172
    },
    {
      "X": 231,
      "Y": 177
    },
    {
      "X": 229,
      "Y": 183
    },
    {
      "X": 227,
      "Y": 188
    },
    {
      "X": 226,
      "Y": 193
    },
    {
      "X": 225,
      "Y": 198
    },
    {
      "X": 223,
      "Y": 203
    },
    {
      "X": 223,
      "Y": 207
    },
    {
      "X": 223,
      "Y": 210
    }
  ]
	]);
	this.Multistrokes[3] = new Multistroke("Rectangle", useBoundedRotationInvariance, [
  [
    {
      "X": 48,
      "Y": 87
    },
    {
      "X": 49,
      "Y": 101
    },
    {
      "X": 50,
      "Y": 103
    },
    {
      "X": 50,
      "Y": 107
    },
    {
      "X": 50,
      "Y": 110
    },
    {
      "X": 50,
      "Y": 113
    },
    {
      "X": 50,
      "Y": 117
    },
    {
      "X": 50,
      "Y": 121
    },
    {
      "X": 49,
      "Y": 125
    },
    {
      "X": 49,
      "Y": 129
    },
    {
      "X": 49,
      "Y": 133
    },
    {
      "X": 49,
      "Y": 138
    },
    {
      "X": 49,
      "Y": 143
    },
    {
      "X": 49,
      "Y": 147
    },
    {
      "X": 49,
      "Y": 152
    },
    {
      "X": 49,
      "Y": 157
    },
    {
      "X": 48,
      "Y": 161
    },
    {
      "X": 47,
      "Y": 165
    },
    {
      "X": 47,
      "Y": 169
    },
    {
      "X": 47,
      "Y": 173
    },
    {
      "X": 46,
      "Y": 177
    },
    {
      "X": 45,
      "Y": 181
    },
    {
      "X": 45,
      "Y": 184
    },
    {
      "X": 45,
      "Y": 187
    },
    {
      "X": 44,
      "Y": 189
    },
    {
      "X": 43,
      "Y": 192
    },
    {
      "X": 43,
      "Y": 194
    },
    {
      "X": 43,
      "Y": 196
    },
    {
      "X": 43,
      "Y": 198
    },
    {
      "X": 42,
      "Y": 199
    },
    {
      "X": 42,
      "Y": 201
    },
    {
      "X": 41,
      "Y": 201
    },
    {
      "X": 41,
      "Y": 203
    },
    {
      "X": 41,
      "Y": 203
    },
    {
      "X": 40,
      "Y": 204
    },
    {
      "X": 39,
      "Y": 205
    },
    {
      "X": 39,
      "Y": 205
    },
    {
      "X": 40,
      "Y": 206
    },
    {
      "X": 41,
      "Y": 206
    },
    {
      "X": 42,
      "Y": 206
    },
    {
      "X": 44,
      "Y": 206
    },
    {
      "X": 45,
      "Y": 205
    },
    {
      "X": 47,
      "Y": 205
    },
    {
      "X": 49,
      "Y": 205
    },
    {
      "X": 51,
      "Y": 204
    },
    {
      "X": 55,
      "Y": 204
    },
    {
      "X": 58,
      "Y": 203
    },
    {
      "X": 62,
      "Y": 203
    },
    {
      "X": 65,
      "Y": 203
    },
    {
      "X": 69,
      "Y": 202
    },
    {
      "X": 75,
      "Y": 202
    },
    {
      "X": 80,
      "Y": 201
    },
    {
      "X": 85,
      "Y": 201
    },
    {
      "X": 91,
      "Y": 201
    },
    {
      "X": 97,
      "Y": 201
    },
    {
      "X": 103,
      "Y": 200
    },
    {
      "X": 110,
      "Y": 200
    },
    {
      "X": 117,
      "Y": 199
    },
    {
      "X": 125,
      "Y": 199
    },
    {
      "X": 132,
      "Y": 199
    },
    {
      "X": 140,
      "Y": 199
    },
    {
      "X": 148,
      "Y": 198
    },
    {
      "X": 157,
      "Y": 197
    },
    {
      "X": 165,
      "Y": 197
    },
    {
      "X": 173,
      "Y": 196
    },
    {
      "X": 182,
      "Y": 195
    },
    {
      "X": 191,
      "Y": 195
    },
    {
      "X": 199,
      "Y": 194
    },
    {
      "X": 209,
      "Y": 194
    },
    {
      "X": 217,
      "Y": 193
    },
    {
      "X": 225,
      "Y": 193
    },
    {
      "X": 233,
      "Y": 194
    },
    {
      "X": 240,
      "Y": 194
    },
    {
      "X": 247,
      "Y": 195
    },
    {
      "X": 255,
      "Y": 195
    },
    {
      "X": 262,
      "Y": 195
    },
    {
      "X": 268,
      "Y": 196
    },
    {
      "X": 275,
      "Y": 196
    },
    {
      "X": 281,
      "Y": 197
    },
    {
      "X": 287,
      "Y": 197
    },
    {
      "X": 293,
      "Y": 197
    },
    {
      "X": 298,
      "Y": 198
    },
    {
      "X": 303,
      "Y": 199
    },
    {
      "X": 308,
      "Y": 199
    },
    {
      "X": 313,
      "Y": 199
    },
    {
      "X": 317,
      "Y": 200
    },
    {
      "X": 321,
      "Y": 201
    },
    {
      "X": 324,
      "Y": 201
    },
    {
      "X": 327,
      "Y": 201
    },
    {
      "X": 331,
      "Y": 202
    },
    {
      "X": 334,
      "Y": 202
    },
    {
      "X": 337,
      "Y": 202
    },
    {
      "X": 340,
      "Y": 202
    },
    {
      "X": 343,
      "Y": 202
    },
    {
      "X": 345,
      "Y": 203
    },
    {
      "X": 347,
      "Y": 203
    },
    {
      "X": 349,
      "Y": 203
    },
    {
      "X": 351,
      "Y": 202
    },
    {
      "X": 352,
      "Y": 202
    },
    {
      "X": 353,
      "Y": 201
    },
    {
      "X": 355,
      "Y": 201
    },
    {
      "X": 356,
      "Y": 201
    },
    {
      "X": 357,
      "Y": 200
    },
    {
      "X": 359,
      "Y": 200
    },
    {
      "X": 359,
      "Y": 199
    },
    {
      "X": 360,
      "Y": 199
    },
    {
      "X": 361,
      "Y": 198
    },
    {
      "X": 361,
      "Y": 197
    },
    {
      "X": 362,
      "Y": 197
    },
    {
      "X": 362,
      "Y": 196
    },
    {
      "X": 363,
      "Y": 195
    },
    {
      "X": 363,
      "Y": 194
    },
    {
      "X": 363,
      "Y": 193
    },
    {
      "X": 363,
      "Y": 192
    },
    {
      "X": 363,
      "Y": 191
    },
    {
      "X": 363,
      "Y": 190
    },
    {
      "X": 363,
      "Y": 189
    },
    {
      "X": 363,
      "Y": 187
    },
    {
      "X": 363,
      "Y": 186
    },
    {
      "X": 363,
      "Y": 185
    },
    {
      "X": 363,
      "Y": 182
    },
    {
      "X": 362,
      "Y": 180
    },
    {
      "X": 362,
      "Y": 177
    },
    {
      "X": 361,
      "Y": 175
    },
    {
      "X": 361,
      "Y": 172
    },
    {
      "X": 360,
      "Y": 169
    },
    {
      "X": 359,
      "Y": 166
    },
    {
      "X": 359,
      "Y": 163
    },
    {
      "X": 359,
      "Y": 160
    },
    {
      "X": 358,
      "Y": 156
    },
    {
      "X": 357,
      "Y": 153
    },
    {
      "X": 357,
      "Y": 149
    },
    {
      "X": 357,
      "Y": 145
    },
    {
      "X": 357,
      "Y": 141
    },
    {
      "X": 356,
      "Y": 137
    },
    {
      "X": 355,
      "Y": 134
    },
    {
      "X": 355,
      "Y": 131
    },
    {
      "X": 355,
      "Y": 127
    },
    {
      "X": 354,
      "Y": 123
    },
    {
      "X": 353,
      "Y": 119
    },
    {
      "X": 353,
      "Y": 116
    },
    {
      "X": 353,
      "Y": 113
    },
    {
      "X": 353,
      "Y": 109
    },
    {
      "X": 353,
      "Y": 107
    },
    {
      "X": 353,
      "Y": 103
    },
    {
      "X": 353,
      "Y": 100
    },
    {
      "X": 352,
      "Y": 97
    },
    {
      "X": 352,
      "Y": 95
    },
    {
      "X": 353,
      "Y": 92
    },
    {
      "X": 353,
      "Y": 89
    },
    {
      "X": 353,
      "Y": 87
    },
    {
      "X": 353,
      "Y": 85
    },
    {
      "X": 353,
      "Y": 82
    },
    {
      "X": 354,
      "Y": 81
    },
    {
      "X": 354,
      "Y": 79
    },
    {
      "X": 354,
      "Y": 77
    },
    {
      "X": 354,
      "Y": 75
    },
    {
      "X": 354,
      "Y": 75
    },
    {
      "X": 355,
      "Y": 73
    },
    {
      "X": 355,
      "Y": 73
    },
    {
      "X": 355,
      "Y": 72
    },
    {
      "X": 354,
      "Y": 71
    },
    {
      "X": 354,
      "Y": 71
    },
    {
      "X": 354,
      "Y": 70
    },
    {
      "X": 354,
      "Y": 69
    },
    {
      "X": 353,
      "Y": 69
    },
    {
      "X": 353,
      "Y": 69
    },
    {
      "X": 352,
      "Y": 69
    },
    {
      "X": 351,
      "Y": 69
    },
    {
      "X": 350,
      "Y": 69
    },
    {
      "X": 349,
      "Y": 69
    },
    {
      "X": 348,
      "Y": 69
    },
    {
      "X": 347,
      "Y": 68
    },
    {
      "X": 345,
      "Y": 68
    },
    {
      "X": 343,
      "Y": 68
    },
    {
      "X": 341,
      "Y": 68
    },
    {
      "X": 339,
      "Y": 68
    },
    {
      "X": 337,
      "Y": 68
    },
    {
      "X": 334,
      "Y": 68
    },
    {
      "X": 331,
      "Y": 69
    },
    {
      "X": 327,
      "Y": 69
    },
    {
      "X": 324,
      "Y": 69
    },
    {
      "X": 321,
      "Y": 70
    },
    {
      "X": 317,
      "Y": 71
    },
    {
      "X": 312,
      "Y": 71
    },
    {
      "X": 307,
      "Y": 72
    },
    {
      "X": 303,
      "Y": 73
    },
    {
      "X": 298,
      "Y": 73
    },
    {
      "X": 293,
      "Y": 74
    },
    {
      "X": 287,
      "Y": 74
    },
    {
      "X": 281,
      "Y": 75
    },
    {
      "X": 275,
      "Y": 75
    },
    {
      "X": 269,
      "Y": 77
    },
    {
      "X": 263,
      "Y": 77
    },
    {
      "X": 257,
      "Y": 78
    },
    {
      "X": 250,
      "Y": 79
    },
    {
      "X": 243,
      "Y": 79
    },
    {
      "X": 237,
      "Y": 80
    },
    {
      "X": 230,
      "Y": 80
    },
    {
      "X": 223,
      "Y": 81
    },
    {
      "X": 216,
      "Y": 81
    },
    {
      "X": 209,
      "Y": 82
    },
    {
      "X": 202,
      "Y": 83
    },
    {
      "X": 191,
      "Y": 84
    },
    {
      "X": 181,
      "Y": 85
    },
    {
      "X": 173,
      "Y": 85
    },
    {
      "X": 164,
      "Y": 85
    },
    {
      "X": 156,
      "Y": 86
    },
    {
      "X": 149,
      "Y": 86
    },
    {
      "X": 142,
      "Y": 86
    },
    {
      "X": 135,
      "Y": 86
    },
    {
      "X": 129,
      "Y": 86
    },
    {
      "X": 122,
      "Y": 86
    },
    {
      "X": 116,
      "Y": 86
    },
    {
      "X": 111,
      "Y": 85
    },
    {
      "X": 105,
      "Y": 85
    },
    {
      "X": 99,
      "Y": 85
    },
    {
      "X": 94,
      "Y": 85
    },
    {
      "X": 89,
      "Y": 85
    },
    {
      "X": 85,
      "Y": 84
    },
    {
      "X": 80,
      "Y": 84
    },
    {
      "X": 75,
      "Y": 83
    },
    {
      "X": 71,
      "Y": 83
    },
    {
      "X": 67,
      "Y": 83
    },
    {
      "X": 63,
      "Y": 82
    },
    {
      "X": 60,
      "Y": 82
    },
    {
      "X": 57,
      "Y": 81
    },
    {
      "X": 53,
      "Y": 81
    },
    {
      "X": 50,
      "Y": 81
    },
    {
      "X": 47,
      "Y": 81
    },
    {
      "X": 45,
      "Y": 81
    },
    {
      "X": 43,
      "Y": 81
    },
    {
      "X": 41,
      "Y": 80
    }
  ]
]);

this.Multistrokes[4] = new Multistroke("Circle", false, [
  [
    {
      "X": 536,
      "Y": 228
    },
    {
      "X": 522,
      "Y": 223
    },
    {
      "X": 520,
      "Y": 223
    },
    {
      "X": 517,
      "Y": 223
    },
    {
      "X": 515,
      "Y": 224
    },
    {
      "X": 512,
      "Y": 224
    },
    {
      "X": 509,
      "Y": 224
    },
    {
      "X": 506,
      "Y": 225
    },
    {
      "X": 504,
      "Y": 225
    },
    {
      "X": 500,
      "Y": 226
    },
    {
      "X": 497,
      "Y": 227
    },
    {
      "X": 494,
      "Y": 228
    },
    {
      "X": 491,
      "Y": 229
    },
    {
      "X": 488,
      "Y": 230
    },
    {
      "X": 484,
      "Y": 232
    },
    {
      "X": 481,
      "Y": 234
    },
    {
      "X": 478,
      "Y": 236
    },
    {
      "X": 474,
      "Y": 238
    },
    {
      "X": 471,
      "Y": 240
    },
    {
      "X": 468,
      "Y": 242
    },
    {
      "X": 465,
      "Y": 244
    },
    {
      "X": 462,
      "Y": 247
    },
    {
      "X": 460,
      "Y": 250
    },
    {
      "X": 457,
      "Y": 254
    },
    {
      "X": 454,
      "Y": 257
    },
    {
      "X": 452,
      "Y": 260
    },
    {
      "X": 450,
      "Y": 264
    },
    {
      "X": 448,
      "Y": 267
    },
    {
      "X": 446,
      "Y": 271
    },
    {
      "X": 445,
      "Y": 275
    },
    {
      "X": 444,
      "Y": 279
    },
    {
      "X": 443,
      "Y": 283
    },
    {
      "X": 442,
      "Y": 287
    },
    {
      "X": 442,
      "Y": 292
    },
    {
      "X": 443,
      "Y": 296
    },
    {
      "X": 444,
      "Y": 300
    },
    {
      "X": 444,
      "Y": 304
    },
    {
      "X": 446,
      "Y": 309
    },
    {
      "X": 448,
      "Y": 314
    },
    {
      "X": 450,
      "Y": 318
    },
    {
      "X": 452,
      "Y": 322
    },
    {
      "X": 455,
      "Y": 326
    },
    {
      "X": 458,
      "Y": 331
    },
    {
      "X": 460,
      "Y": 335
    },
    {
      "X": 464,
      "Y": 339
    },
    {
      "X": 468,
      "Y": 343
    },
    {
      "X": 472,
      "Y": 347
    },
    {
      "X": 476,
      "Y": 350
    },
    {
      "X": 481,
      "Y": 354
    },
    {
      "X": 486,
      "Y": 357
    },
    {
      "X": 490,
      "Y": 360
    },
    {
      "X": 496,
      "Y": 363
    },
    {
      "X": 501,
      "Y": 366
    },
    {
      "X": 506,
      "Y": 368
    },
    {
      "X": 512,
      "Y": 370
    },
    {
      "X": 518,
      "Y": 372
    },
    {
      "X": 524,
      "Y": 374
    },
    {
      "X": 530,
      "Y": 375
    },
    {
      "X": 536,
      "Y": 376
    },
    {
      "X": 542,
      "Y": 376
    },
    {
      "X": 548,
      "Y": 377
    },
    {
      "X": 554,
      "Y": 377
    },
    {
      "X": 560,
      "Y": 377
    },
    {
      "X": 567,
      "Y": 376
    },
    {
      "X": 573,
      "Y": 375
    },
    {
      "X": 580,
      "Y": 374
    },
    {
      "X": 585,
      "Y": 372
    },
    {
      "X": 591,
      "Y": 370
    },
    {
      "X": 596,
      "Y": 369
    },
    {
      "X": 602,
      "Y": 367
    },
    {
      "X": 607,
      "Y": 365
    },
    {
      "X": 612,
      "Y": 362
    },
    {
      "X": 616,
      "Y": 360
    },
    {
      "X": 620,
      "Y": 358
    },
    {
      "X": 624,
      "Y": 355
    },
    {
      "X": 628,
      "Y": 352
    },
    {
      "X": 631,
      "Y": 348
    },
    {
      "X": 634,
      "Y": 345
    },
    {
      "X": 636,
      "Y": 342
    },
    {
      "X": 639,
      "Y": 338
    },
    {
      "X": 640,
      "Y": 335
    },
    {
      "X": 642,
      "Y": 331
    },
    {
      "X": 642,
      "Y": 328
    },
    {
      "X": 643,
      "Y": 324
    },
    {
      "X": 643,
      "Y": 320
    },
    {
      "X": 642,
      "Y": 316
    },
    {
      "X": 641,
      "Y": 312
    },
    {
      "X": 640,
      "Y": 308
    },
    {
      "X": 638,
      "Y": 304
    },
    {
      "X": 636,
      "Y": 300
    },
    {
      "X": 633,
      "Y": 296
    },
    {
      "X": 631,
      "Y": 292
    },
    {
      "X": 628,
      "Y": 288
    },
    {
      "X": 624,
      "Y": 284
    },
    {
      "X": 621,
      "Y": 280
    },
    {
      "X": 617,
      "Y": 276
    },
    {
      "X": 613,
      "Y": 272
    },
    {
      "X": 609,
      "Y": 268
    },
    {
      "X": 605,
      "Y": 265
    },
    {
      "X": 600,
      "Y": 261
    },
    {
      "X": 596,
      "Y": 258
    },
    {
      "X": 591,
      "Y": 254
    },
    {
      "X": 586,
      "Y": 251
    },
    {
      "X": 581,
      "Y": 248
    },
    {
      "X": 576,
      "Y": 244
    },
    {
      "X": 570,
      "Y": 241
    },
    {
      "X": 565,
      "Y": 238
    },
    {
      "X": 560,
      "Y": 236
    },
    {
      "X": 554,
      "Y": 234
    },
    {
      "X": 548,
      "Y": 232
    },
    {
      "X": 542,
      "Y": 230
    },
    {
      "X": 537,
      "Y": 228
    },
    {
      "X": 531,
      "Y": 227
    },
    {
      "X": 526,
      "Y": 226
    },
    {
      "X": 520,
      "Y": 225
    },
    {
      "X": 515,
      "Y": 225
    },
    {
      "X": 510,
      "Y": 225
    }
  ]
]); 
	// this.Multistrokes[5] = new Multistroke("H", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(188,137),new Point(188,225)),
	// 	new Array(new Point(188,180),new Point(241,180)),
	// 	new Array(new Point(241,137),new Point(241,225))
	// ));
	// this.Multistrokes[6] = new Multistroke("I", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(371,149),new Point(371,221)),
	// 	new Array(new Point(341,149),new Point(401,149)),
	// 	new Array(new Point(341,221),new Point(401,221))
	// ));
	// this.Multistrokes[7] = new Multistroke("exclamation", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(526,142),new Point(526,204)),
	// 	new Array(new Point(526,221))
	// ));
	// this.Multistrokes[8] = new Multistroke("line", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(12,347),new Point(119,347))
	// ));
	// this.Multistrokes[9] = new Multistroke("five-point star", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(177,396),new Point(223,299),new Point(262,396),new Point(168,332),new Point(278,332),new Point(184,397))
	// ));
	// this.Multistrokes[10] = new Multistroke("null", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(382,310),new Point(377,308),new Point(373,307),new Point(366,307),new Point(360,310),new Point(356,313),new Point(353,316),new Point(349,321),new Point(347,326),new Point(344,331),new Point(342,337),new Point(341,343),new Point(341,350),new Point(341,358),new Point(342,362),new Point(344,366),new Point(347,370),new Point(351,374),new Point(356,379),new Point(361,382),new Point(368,385),new Point(374,387),new Point(381,387),new Point(390,387),new Point(397,385),new Point(404,382),new Point(408,378),new Point(412,373),new Point(416,367),new Point(418,361),new Point(419,353),new Point(418,346),new Point(417,341),new Point(416,336),new Point(413,331),new Point(410,326),new Point(404,320),new Point(400,317),new Point(393,313),new Point(392,312)),
	// 	new Array(new Point(418,309),new Point(337,390))
	// ));
	// this.Multistrokes[11] = new Multistroke("arrowhead", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(506,349),new Point(574,349)),
	// 	new Array(new Point(525,306),new Point(584,349),new Point(525,388))
	// ));
	// this.Multistrokes[12] = new Multistroke("pitchfork", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(38,470),new Point(36,476),new Point(36,482),new Point(37,489),new Point(39,496),new Point(42,500),new Point(46,503),new Point(50,507),new Point(56,509),new Point(63,509),new Point(70,508),new Point(75,506),new Point(79,503),new Point(82,499),new Point(85,493),new Point(87,487),new Point(88,480),new Point(88,474),new Point(87,468)),
	// 	new Array(new Point(62,464),new Point(62,571))
	// ));
	// this.Multistrokes[13] = new Multistroke("six-point star", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(177,554),new Point(223,476),new Point(268,554),new Point(183,554)),
	// 	new Array(new Point(177,490),new Point(223,568),new Point(268,490),new Point(183,490))
	// ));
	// this.Multistrokes[14] = new Multistroke("asterisk", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(325,499),new Point(417,557)),
	// 	new Array(new Point(417,499),new Point(325,557)),
	// 	new Array(new Point(371,486),new Point(371,571))
	// ));
	// this.Multistrokes[15] = new Multistroke("half-note", useBoundedRotationInvariance, new Array(
	// 	new Array(new Point(546,465),new Point(546,531)),
	// 	new Array(new Point(540,530),new Point(536,529),new Point(533,528),new Point(529,529),new Point(524,530),new Point(520,532),new Point(515,535),new Point(511,539),new Point(508,545),new Point(506,548),new Point(506,554),new Point(509,558),new Point(512,561),new Point(517,564),new Point(521,564),new Point(527,563),new Point(531,560),new Point(535,557),new Point(538,553),new Point(542,548),new Point(544,544),new Point(546,540),new Point(546,536))
	// ));

	//
	// The $N Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(strokes, useBoundedRotationInvariance, requireSameNoOfStrokes, useProtractor)
	{
		var points = CombineStrokes(strokes); // make one connected unistroke from the given strokes
		points = Resample(points, NumPoints);
		var radians = IndicativeAngle(points);
		points = RotateBy(points, -radians);
		points = ScaleDimTo(points, SquareSize, OneDThreshold);
		if (useBoundedRotationInvariance)
			points = RotateBy(points, +radians); // restore
		points = TranslateTo(points, Origin);
		var startv = CalcStartUnitVector(points, StartAngleIndex);
		var vector = Vectorize(points, useBoundedRotationInvariance); // for Protractor

		var b = +Infinity;
		var u = -1;
		for (var i = 0; i < this.Multistrokes.length; i++) // for each multistroke
		{
			if (!requireSameNoOfStrokes || strokes.length == this.Multistrokes[i].NumStrokes) // optional -- only attempt match when same # of component strokes
			{
				for (var j = 0; j < this.Multistrokes[i].Unistrokes.length; j++) // each unistroke within this multistroke
				{
					if (AngleBetweenUnitVectors(startv, this.Multistrokes[i].Unistrokes[j].StartUnitVector) <= AngleSimilarityThreshold) // strokes start in the same direction
					{
						var d;
						if (useProtractor) // for Protractor
							d = OptimalCosineDistance(this.Multistrokes[i].Unistrokes[j].Vector, vector);
						else // Golden Section Search (original $N)
							d = DistanceAtBestAngle(points, this.Multistrokes[i].Unistrokes[j], -AngleRange, +AngleRange, AnglePrecision);
						if (d < b) {
							b = d; // best (least) distance
							u = i; // multistroke owner of unistroke
						}
					}
				}
			}
		}
		return (u == -1) ? new Result("No match.", 0.0) : new Result(this.Multistrokes[u].Name, useProtractor ? 1.0 / b : 1.0 - b / HalfDiagonal);
	};
	this.AddGesture = function(name, useBoundedRotationInvariance, strokes)
	{
		this.Multistrokes[this.Multistrokes.length] = new Multistroke(name, useBoundedRotationInvariance, strokes);
		var num = 0;
		for (var i = 0; i < this.Multistrokes.length; i++) {
			if (this.Multistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserGestures = function()
	{
		this.Multistrokes.length = NumMultistrokes; // clear any beyond the original set
		return NumMultistrokes;
	}
}
//
// Private helper functions from this point down
//
function HeapPermute(n, order, /*out*/ orders)
{
	if (n == 1)
	{
		orders[orders.length] = order.slice(); // append copy
	}
	else
	{
		for (var i = 0; i < n; i++)
		{
			HeapPermute(n - 1, order, orders);
			if (n % 2 == 1) // swap 0, n-1
			{
				var tmp = order[0];
				order[0] = order[n - 1];
				order[n - 1] = tmp;
			}
			else // swap i, n-1
			{
				var tmp = order[i];
				order[i] = order[n - 1];
				order[n - 1] = tmp;
			}
		}
	}
}
function MakeUnistrokes(strokes, orders)
{
	var unistrokes = new Array(); // array of point arrays
	for (var r = 0; r < orders.length; r++)
	{
		for (var b = 0; b < Math.pow(2, orders[r].length); b++) // use b's bits for directions
		{
			var unistroke = new Array(); // array of points
			for (var i = 0; i < orders[r].length; i++)
			{
				var pts;
				if (((b >> i) & 1) == 1) {  // is b's bit at index i on?
					pts = strokes[orders[r][i]].slice().reverse(); // copy and reverse
				} else {
					pts = strokes[orders[r][i]].slice(); // copy
				}
				for (var p = 0; p < pts.length; p++) {
					unistroke[unistroke.length] = pts[p]; // append points
				}
			}
			unistrokes[unistrokes.length] = unistroke; // add one unistroke to set
		}
	}
	return unistrokes;
}
function CombineStrokes(strokes)
{
	var points = new Array();
	for (var s = 0; s < strokes.length; s++) {
		for (var p = 0; p < strokes[s].length; p++) {
			points[points.length] = new Point(strokes[s][p].X, strokes[s][p].Y);
		}
	}
	return points;
}
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i - 1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
			var qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
			var q = new Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function ScaleDimTo(points, size, ratio1D) // scales bbox uniformly for 1D, non-uniformly for 2D
{
	var B = BoundingBox(points);
	var uniformly = Math.min(B.Width / B.Height, B.Height / B.Width) <= ratio1D; // 1D or 2D gesture test
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = uniformly ? points[i].X * (size / Math.max(B.Width, B.Height)) : points[i].X * (size / B.Width);
		var qy = uniformly ? points[i].Y * (size / Math.max(B.Width, B.Height)) : points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function Vectorize(points, useBoundedRotationInvariance) // for Protractor
{
	var cos = 1.0;
	var sin = 0.0;
	if (useBoundedRotationInvariance) {
		var iAngle = Math.atan2(points[0].Y, points[0].X);
		var baseOrientation = (Math.PI / 4.0) * Math.floor((iAngle + Math.PI / 8.0) / (Math.PI / 4.0));
		cos = Math.cos(baseOrientation - iAngle);
		sin = Math.sin(baseOrientation - iAngle);
	}
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		var newX = points[i].X * cos - points[i].Y * sin;
		var newY = points[i].Y * cos + points[i].X * sin;
		vector[vector.length] = newX;
		vector[vector.length] = newY;
		sum += newX * newX + newY * newY;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
                b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new Point(x, y);
}
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2) // average distance between corresponding points in two paths
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}
function Distance(p1, p2) // distance between two points
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function CalcStartUnitVector(points, index) // start angle from points[0] to points[index] normalized as a unit vector
{
	var v = new Point(points[index].X - points[0].X, points[index].Y - points[0].Y);
	var len = Math.sqrt(v.X * v.X + v.Y * v.Y);
	return new Point(v.X / len, v.Y / len);
}
function AngleBetweenUnitVectors(v1, v2) // gives acute angle between unit vectors from (0,0) to v1, and (0,0) to v2
{
	var n = (v1.X * v2.X + v1.Y * v2.Y);
	if (n < -1.0 || n > +1.0)
		n = Round(n, 5); // fix: JavaScript rounding bug that can occur so that -1 <= n <= +1
	return Math.acos(n); // arc cosine of the vector dot product
}
function Round(n,d) { d = Math.pow(10,d); return Math.round(n*d)/d; } // round 'n' to 'd' decimals
function Deg2Rad(d) { return (d * Math.PI / 180.0); }
