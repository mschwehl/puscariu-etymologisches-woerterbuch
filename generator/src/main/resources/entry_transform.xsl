<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" encoding="UTF-8" indent="yes" omit-xml-declaration="yes"/>

    <!-- Main template for the entry -->
    <xsl:template match="/entry">
        <div class="space-y-3 text-gray-800 text-sm">
            <!-- Header Section -->
            <div class="mb-4 pb-2 border-b border-gray-300">
                <span class="lemma text-2xl font-bold text-gray-900">
                    <xsl:value-of select="lemma"/>
                </span>
                <xsl:if test="feminine_neuter != ''">
                    <span class="italic text-gray-600 ml-1">
                        <xsl:value-of select="feminine_neuter"/>
                    </span>
                </xsl:if>
                <xsl:if test="pos != ''">
                    <span class="pos italic text-blue-600 ml-2">
                        (<xsl:value-of select="pos"/>)
                    </span>
                </xsl:if>
                 <!-- Top-level variants -->
                 <xsl:apply-templates select="variants"/>
            </div>

            <!-- Apply templates for other direct children like definition, etymology, etc. -->
            <xsl:apply-templates select="definition | senses | etymology | usage_note | morphology_discussion | semantic_note | comment"/>

        </div>
    </xsl:template>

    <!-- Template for <variants> (usually at top level) -->
    <xsl:template match="variants">
         <span class="variants italic text-gray-500 text-sm ml-2">
            <xsl:apply-templates/> <!-- Process text and any nested elements like <form> -->
         </span>
    </xsl:template>

    <!-- Template for <definition> -->
    <xsl:template match="definition">
        <p class="definition italic ml-4">
             <xsl:apply-templates/> <!-- Allows processing nested elements like <form> if they occur -->
        </p>
    </xsl:template>

     <!-- Template for <senses> container -->
    <xsl:template match="senses">
        <div class="senses ml-4 mt-2">
            <ol class="list-decimal pl-5"> <!-- Use Tailwind/CSS for list style if needed -->
                <xsl:apply-templates select="sense"/>
            </ol>
        </div>
    </xsl:template>

     <!-- Template for individual <sense> -->
     <xsl:template match="sense">
        <li class="mb-2">
            <xsl:apply-templates select="definition"/>
            <xsl:apply-templates select="example"/>
            <!-- Add other elements within sense if necessary -->
        </li>
     </xsl:template>

    <!-- Template for <example> -->
    <xsl:template match="example">
        <p class="example">
            <xsl:apply-templates/>
        </p>
    </xsl:template>


    <!-- Template for generic sections (etymology, usage_note, etc.) -->
    <xsl:template match="etymology | usage_note | morphology_discussion | semantic_note | comment">
        <div class="{local-name()}-section border-t border-gray-200 pt-2 mt-2">
            <!-- Process contents of the section -->
            <xsl:apply-templates/>
        </div>
    </xsl:template>

     <!-- Template for <etymology> specific processing (like source) -->
     <xsl:template match="etymology/*"> <!-- Process children of etymology -->
         <xsl:choose>
            <xsl:when test="self::etymon">
                <xsl:call-template name="formatEtymon"/>
            </xsl:when>
             <xsl:when test="self::cognates">
                 <xsl:call-template name="formatCognates"/>
             </xsl:when>
              <xsl:when test="self::derived_forms | self::related_form | self::excluded_form | self::compounds_phrases">
                 <xsl:call-template name="formatFormListLike">
                      <xsl:with-param name="elementName" select="local-name()"/>
                      <xsl:with-param name="label">
                           <xsl:choose>
                               <xsl:when test="self::derived_forms">Derived:</xsl:when>
                               <xsl:when test="self::related_form">Related:</xsl:when>
                               <xsl:when test="self::excluded_form">Exclude:</xsl:when>
                               <xsl:when test="self::compounds_phrases">Compounds/Phrases:</xsl:when>
                               <xsl:otherwise><xsl:value-of select="local-name()"/>:</xsl:otherwise>
                           </xsl:choose>
                      </xsl:with-param>
                 </xsl:call-template>
             </xsl:when>
             <xsl:when test="self::note">
                 <p class="text-gray-600 text-xs italic my-1 ml-4">
                     <xsl:apply-templates/>
                 </p>
             </xsl:when>
             <!-- Add other specific etymology elements here -->
             <xsl:otherwise>
                  <!-- Default handling for unexpected elements or text within etymology -->
                 <xsl:if test="normalize-space(.) != ''">
                      <p class="text-gray-600 text-xs italic my-1 ml-4">
                          <xsl:apply-templates/>
                      </p>
                 </xsl:if>
             </xsl:otherwise>
         </xsl:choose>
     </xsl:template>

    <!-- Add source attribute display for etymology itself -->
     <xsl:template match="etymology">
        <div class="etymology-section border-t border-gray-200 pt-2 mt-2">
             <xsl:if test="@source != ''">
                <p class="reference text-gray-500 text-xs italic ml-4 mb-1">
                    Source: <xsl:value-of select="@source"/>
                </p>
            </xsl:if>
            <!-- Process children -->
            <xsl:apply-templates/>
        </div>
    </xsl:template>


    <!-- Named template for <etymon> -->
    <xsl:template name="formatEtymon">
        <div class="ml-4 my-1">
            <code class="etymon font-mono italic text-red-600 text-sm">
                <!-- Process text nodes directly inside etymon, excluding nested elements -->
                <xsl:value-of select="text()[normalize-space()]"/>
            </code>
            <xsl:if test="@lang != ''">
                <span class="lang-tag">
                    <xsl:value-of select="translate(@lang, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
                </span>
            </xsl:if>
             <!-- Apply templates to process nested elements like <cognates> or <note> or trailing text -->
             <xsl:apply-templates select="node()[not(self::text())] | text()[normalize-space() and position() > 1]"/>
        </div>
    </xsl:template>

     <!-- Named template for <cognates> -->
    <xsl:template name="formatCognates">
         <div class="cognates ml-4 my-1"> <!-- Indent relative to parent (etymon or etymology) -->
             <xsl:apply-templates/> <!-- Process <form>, <note>, text inside -->
         </div>
    </xsl:template>

    <!-- Named template for lists like derived_forms, related_form etc. -->
    <xsl:template name="formatFormListLike">
        <xsl:param name="elementName"/>
        <xsl:param name="label"/>
         <div class="{$elementName} ml-4 my-1"> <!-- Use dynamic class based on element name -->
              <xsl:if test="$label != ''">
                 <span class="text-xs font-semibold mr-1"><xsl:value-of select="$label"/></span>
              </xsl:if>
              <!-- Apply templates to process inner content (forms, text, notes) -->
              <xsl:apply-templates/>
         </div>
    </xsl:template>


    <!-- Template for <form> elements (used within cognates, usage_note etc.) -->
    <xsl:template match="form">
        <code class="form font-mono italic text-red-600 text-sm">
            <xsl:value-of select="."/>
        </code>
        <xsl:if test="@lang != ''">
            <span class="lang-tag">
                <xsl:value-of select="translate(@lang, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
            </span>
        </xsl:if>
        <xsl:text> </xsl:text> <!-- Add space after form -->
    </xsl:template>

     <!-- Template for <note> elements -->
    <xsl:template match="note">
         <span class="text-gray-600 text-xs italic my-1">
              (<xsl:apply-templates/>) <!-- Wrap note text in parentheses -->
         </span>
    </xsl:template>

     <!-- Template for <reference> elements -->
    <xsl:template match="reference">
         <span class="reference text-gray-500 text-xs italic">
              <xsl:apply-templates/>
         </span>
    </xsl:template>

    <!-- Default template for text nodes: just output the text -->
    <xsl:template match="text()">
        <xsl:value-of select="normalize-space(.)"/>
         <xsl:if test="normalize-space(.) != '' and not(parent::code or parent::span[contains(@class, 'tag')])">
             <xsl:text> </xsl:text> <!-- Add space after text nodes unless they are inside code/tags -->
         </xsl:if>
    </xsl:template>

     <!-- Template to ignore comments -->
     <xsl:template match="comment()"/>

</xsl:stylesheet>